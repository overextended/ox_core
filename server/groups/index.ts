import { addAce, addCommand, addPrincipal, removeAce, removePrincipal } from '@overextended/ox_lib/server';
import { SelectGroups } from './db';
import { OxPlayer } from 'player/class';
import type { Dict, OxGroup, DbGroup } from 'types';
import { GetGroupPermissions } from '../../common';

const groups: Dict<OxGroup> = {};
GlobalState.groups = [];

export function GetGroup(name: string) {
  return groups[name];
}

export function GetGroupsByType(type: string) {
  return Object.values(groups).reduce((acc, group) => {
    if (group.type === type) acc.push(group.name);
    return acc;
  }, [] as string[]);
}

export function SetGroupPermission(groupName: string, grade: number, permission: string, value: 'allow' | 'deny') {
  const permissions = GetGroupPermissions(groupName);

  if (!permissions[grade]) permissions[grade] = {};

  permissions[grade][permission] = value === 'allow' ? true : false;
  GlobalState[`group.${groupName}:permissions`] = permissions;
}

export function RemoveGroupPermission(groupName: string, grade: number, permission: string) {
  const permissions = GetGroupPermissions(groupName);

  if (!permissions[grade]) return;

  delete permissions[grade][permission];
  GlobalState[`group.${groupName}:permissions`] = permissions;
}

async function CreateGroup(data: DbGroup) {
  const group: OxGroup = {
    ...data,
    grades: JSON.parse(data.grades as any),
    principal: `group.${data.name}`,
  };

  GlobalState[group.principal] = group;
  GlobalState[`${group.name}:count`] = 0;

  groups[group.name] = group;
  group.grades = group.grades.reduce(
    (acc, value, index) => {
      acc[index + 1] = value;
      return acc;
    },
    {} as Record<number, string>
  ) as any;

  let parent = group.principal;

  for (const i in group.grades) {
    const child = `${group.principal}:${i}`;

    if (!IsPrincipalAceAllowed(child, child)) {
      addAce(child, child, true);
      addPrincipal(child, parent);
    }

    parent = child;
  }

  DEV: console.info(`Instantiated OxGroup<${group.name}>`);
}

//@ts-ignore todo
function DeleteGroup(group: OxGroup) {
  let parent = group.principal;

  removeAce(parent, parent, true);

  for (const i in group.grades) {
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

  GlobalState.groups = Object.values(groups).reduce((acc, group) => {
    acc.push(group.name);
    return acc;
  }, [] as string[]);
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

exports('SetGroupPermission', SetGroupPermission);
exports('RemoveGroupPermission', RemoveGroupPermission);
