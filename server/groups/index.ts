import { addAce, addCommand, addPrincipal, removeAce, removePrincipal } from '@overextended/ox_lib/server';
import { SelectGroups } from './db';
import { OxPlayer } from 'player/class';

export class OxGroup {
  name: string;
  label: string;
  grades: string[];
  principal: string;

  static #groups: Dict<OxGroup> = {};

  static get(name: string) {
    return this.#groups[name];
  }

  static getAll() {
    return this.#groups;
  }

  getPlayersFromGroup(group: string) {
    const groupPlayerCount = GlobalState[`${group}:count`];

    let playersInGroup = [];

    const players = Object.values(OxPlayer.getAll());

    for (const player of players) {
      if (player.hasGroup(group)) {
        playersInGroup.push(player);
      
        if (playersInGroup.length === groupPlayerCount) {
          break;
        }
      }
    }

    return playersInGroup;
  }

  constructor({ name, grades, label }: Partial<OxGroup>) {
    OxGroup.#groups[name] = this;

    this.name = name;
    this.label = label;
    this.grades = JSON.parse(grades as any);
    this.principal = `group.${this.name}`;
    this.grades.unshift(null);

    let parent = this.principal;

    for (let i = 0; i < this.grades.length; i++) {
      const child = `${this.principal}:${i}`;

      if (!IsPrincipalAceAllowed(child, child)) {
        addAce(child, child, true);
        addPrincipal(child, parent);
      }

      parent = child;
    }

    GlobalState[this.principal] = this;
    GlobalState[`${this.name}:count`] = 0;

    DEV: console.info(`Instantiated OxGroup<${this.name}>`);
  }

  delete() {
    let parent = this.principal;

    removeAce(parent, parent, true);

    for (let i = 0; i < this.grades.length; i++) {
      const child = `${this.principal}:${i}`;

      removeAce(child, child, true);
      removePrincipal(child, parent);

      parent = child;
    }
  }
}

async function LoadGroups() {
  const rows = await SelectGroups();

  if (!rows[0]) return;

  for (let i = 0; i < rows.length; i++) new OxGroup(rows[i]);
}

setImmediate(LoadGroups);

addCommand('reloadgroups', LoadGroups, {
  help: 'Reload groups from the database.',
  restricted: 'group.admin',
});

addCommand<{ target: string; group: string; grade?: number }>(
  'setgroup',
  async (playerId, args, raw) => {
    const player = OxPlayer.get(args.target);

    player?.setGroup(args.group, args.grade || 0);
  },
  {
    help: `Update a player's grade for a group.`,
    params: [
      { name: 'target', paramType: 'playerId' },
      { name: 'group', paramType: 'string' },
      {
        name: 'grade',
        paramType: 'number',
        help: 'The new grade to set. Set to 0 or omit to remove the group.',
        optional: true,
      },
    ],
  }
);

addCommand<{ target: string; group: string; inService: number }>(
  'setgroupservice',
  async (playerId, args, raw) => {
    const player = OxPlayer.get(args.target);

    const inService = args.inService === 1;

    player?.setGroupService(args.group, inService);
  },
  {
    help: `Update a player's service status for a group.`,
    params: [
      { name: 'target', paramType: 'playerId' },
      { name: 'group', paramType: 'string' },
      { name: 'inService', paramType: 'number', help: 'The new service status to set.' },
    ],
  }
);

// Command to list all groups
addCommand('listgroups', async () => {
  console.log('Groups:', OxGroup.getAll());
  return Promise.resolve();
});