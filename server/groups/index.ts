import { addAce, addCommand, addPrincipal, removeAce, removePrincipal } from '@overextended/ox_lib/server';
import { SelectGroups } from './db';
import { OxPlayer } from 'player/class';

export interface OxGroup {
  name: string;
  label: string;
  grades: string[];
  principal: string;
}

const groups: Dict<OxGroup> = {};

export function GetGroup(name: string) {
  return groups[name];
}

async function CreateGroup({ name, grades, label }: Partial<OxGroup>) {
  const group: OxGroup = {
    name,
    label,
    grades: JSON.parse(grades as any),
    principal: `group.${name}`,
  };

  group.grades.unshift(null);

  let parent = group.principal;

  for (let i = 0; i < group.grades.length; i++) {
    const child = `${group.principal}:${i}`;

    if (!IsPrincipalAceAllowed(child, child)) {
      addAce(child, child, true);
      addPrincipal(child, parent);
    }

    parent = child;
  }

  groups[name] = group;
  GlobalState[group.principal] = group;
  GlobalState[`${group.name}:count`] = 0;

  DEV: console.info(`Instantiated OxGroup<${group.name}>`);
}

function DeleteGroup(group: OxGroup) {
  let parent = group.principal;

  removeAce(parent, parent, true);

  for (let i = 0; i < group.grades.length; i++) {
    const child = `${group.principal}:${i}`;

    removeAce(child, child, true);
    removePrincipal(child, parent);

    parent = child;
  }

  delete groups[group.name];
}

async function LoadGroups() {
  const rows = await SelectGroups();

  if (!rows[0]) return;

  for (let i = 0; i < rows.length; i++) CreateGroup(rows[i]);
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
