import { addAce, addCommand, addPrincipal, removeAce, removePrincipal } from '@communityox/ox_lib/server';
import { InsertGroup, RemoveGroup, SelectGroups } from './db';
import { OxPlayer } from 'player/class';
import type { Dict, OxGroup, DbGroup, CreateGroupProperties, OxAccountRole } from 'types';
import { GetGroupPermissions } from '../../common';
import { GetGroupAccount } from 'accounts';
import { CreateNewAccount } from 'accounts/db';

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

export function GetGroupActivePlayers(groupName: string) {
  const group = groups[groupName];

  return group ? [...group.activePlayers] : [];
}

export function GetGroupActivePlayersByType(type: string) {
  return Object.values(groups).reduce((acc, group) => {
    if (group.type === type) {
      acc.push(...group.activePlayers);
    }
    return acc;
  }, [] as number[]);
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

function SetupGroup(data: DbGroup) {
  const group: OxGroup = {
    ...data,
    principal: `group.${data.name}`,
    hasAccount: Boolean(data.hasAccount),
  };

  GlobalState[group.principal] = group;
  GlobalState[`${group.name}:count`] = 0;
  GlobalState[`${group.name}:activeCount`] = 0;

  group.activePlayers = new Set();

  groups[group.name] = group;
  group.grades = group.grades.reduce(
    (acc, value, index) => {
      acc[index + 1] = value;
      return acc;
    },
    {} as Record<number, string>,
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

  if (group.hasAccount) {
    GetGroupAccount(group.name).then((account) => {
      if (!account) CreateNewAccount(group.name, group.label, true);
    });
  }

  DEV: console.info(`Instantiated OxGroup<${group.name}>`);

  return group;
}

// @todo more data validation and error handling
export async function CreateGroup(data: CreateGroupProperties) {
  if (groups[data.name]) throw new Error(`Cannot create OxGroup<${data.name}> (group already exists with that name)`);

  const grades = data.grades.map((grade) => grade.label);
  const accountRoles = data.grades.reduce(
    (acc, grade, index) => {
      if (grade.accountRole) acc[index + 1] = grade.accountRole;
      return acc;
    },
    {} as Dict<OxAccountRole>,
  );

  const group: DbGroup = {
    ...data,
    grades: grades,
    accountRoles: accountRoles,
    hasAccount: data.hasAccount ?? false,
    activePlayers: new Set(),
  };

  const response = await InsertGroup(group);

  if (response) {
    SetupGroup(group);
    GlobalState.groups = [...GlobalState.groups, data.name];
  }
}

export async function DeleteGroup(groupName: string) {
  const deleted = await RemoveGroup(groupName);
  const group = deleted && groups[groupName];

  if (!group) throw new Error(`Cannot delete OxGroup<${groupName}> (no group exists with that name)`);

  let parent = group.principal;

  removeAce(parent, parent, true);

  for (const i in group.grades) {
    const child = `${group.principal}:${i}`;

    removeAce(child, child, true);
    removePrincipal(child, parent);

    parent = child;
  }

  const players = OxPlayer.getAll({
    groups: groupName,
  });

  for (const id in players) {
    const player = players[id];

    player.setGroup(groupName, 0, true);
  }

  GlobalState[group.principal] = null;
  GlobalState[`${group.name}:count`] = null;
  GlobalState[`${group.name}:activeCount`] = null;
  GlobalState.groups = GlobalState.groups.filter((name: string) => name !== groupName);
  delete groups[group.name];
}

async function LoadGroups() {
  const dbGroups = await SelectGroups();
  GlobalState.groups = dbGroups.map((group) => SetupGroup(group).name);
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
    restricted: 'group.admin',
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
  },
);

exports('GetGroupsByType', GetGroupsByType);
exports('SetGroupPermission', SetGroupPermission);
exports('RemoveGroupPermission', RemoveGroupPermission);
exports('CreateGroup', CreateGroup);
exports('DeleteGroup', DeleteGroup);
exports('GetGroupActivePlayers', GetGroupActivePlayers);
exports('GetGroupActivePlayersByType', GetGroupActivePlayersByType);
