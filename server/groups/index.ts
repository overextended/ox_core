import { addAce, addCommand, addPrincipal, removeAce, removePrincipal } from '@overextended/ox_lib/server';
import { AddCharacterGroup, LoadCharacterGroups, RemoveCharacterGroup, SelectGroups, UpdateCharacterGroup } from './db';
import { OxPlayer } from 'player/class';

export const groups: Dict<any> = {};

export class OxGroup {
  name: string;
  label: string;
  grades: string[];
  principal: string;
  #members: Dict<number>;

  static #groups: Dict<OxGroup> = {};

  static get(name: string) {
    return this.#groups[name];
  }

  static async loadPlayerGroups(player: OxPlayer) {
    const rows = await LoadCharacterGroups(player.charId);

    rows.forEach(({ name, grade }) => {
      const group = this.#groups[name];

      if (group) {
        group.#addGroup(player, grade);
      }
    });
  }

  static clearPlayerGroups(player: OxPlayer) {
    const groups = player.getGroups();

    for (const name in groups) {
      const group = this.#groups[name];
      group.#removeGroup(player, groups[name]);
      GlobalState[`${this.name}:count`] -= 1;
    }
  }

  constructor({ name, grades, label }: Partial<OxGroup>) {
    OxGroup.#groups[name] = this;

    this.name = name;
    this.label = label;
    this.grades = JSON.parse(grades as any);
    this.principal = `group.${this.name}`;
    this.#members = {};
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

  #addGroup(player: OxPlayer, grade: number) {
    addPrincipal(player.source as string, `${this.principal}:${grade}`);
    console.log('add the group', this.name, grade);

    player.getGroups()[this.name] = grade;
    this.#members[player.source] = grade;
  }

  #removeGroup(player: OxPlayer, grade: number) {
    removePrincipal(player.source as string, `${this.principal}:${grade}`);
    console.log('remove the group', this.name, grade);

    delete player.getGroups()[this.name];
    delete this.#members[player.source];
  }

  async setPlayerGrade(player: OxPlayer, grade: number) {
    if (!player.charId) return;

    const currentGrade = this.#members[player.source];

    if (currentGrade === grade) return;

    if (!grade) {
      if (!currentGrade) return;

      if (!(await RemoveCharacterGroup(player.charId, this.name))) return;

      this.#removeGroup(player, currentGrade);
      GlobalState[`${this.name}:count`] -= 1;
    } else {
      if (!this.grades[grade] && grade > 0)
        console.warn(`Failed to set OxPlayer<${player.userId}> ${this.name}:${grade} (invalid grade)`);

      if (currentGrade) {
        if (!(await UpdateCharacterGroup(player.charId, this.name, grade))) return;

        this.#removeGroup(player, currentGrade);
        this.#addGroup(player, grade);
      } else {
        if (!(await AddCharacterGroup(player.charId, this.name, grade))) return;

        this.#addGroup(player, grade);
        GlobalState[`${this.name}:count`] += 1;
      }
    }

    emit('ox:setGroup', player.source, this.name, grade ? grade : null);
    emitNet('ox:setGroup', player.source, this.name, grade ? grade : null);

    return true;
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
  (playerId, args, raw) => {
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
