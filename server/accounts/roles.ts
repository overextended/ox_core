import { db } from 'db';
import type { OxAccountPermissions, OxAccountRole } from 'types';
import { SelectAccount } from './db';
import { GetGroup } from 'groups';
import { OxPlayer } from 'player/class';

type OxAccountMetadataRow = OxAccountPermissions & { id?: number; name?: OxAccountRole };

const accountRoles = {} as Record<string, OxAccountPermissions>;

const blacklistedGroupActions = {
  addUser: true,
  removeUser: true,
  manageUser: true,
  transferOwnership: true,
  manageAccount: true,
  closeAccount: true,
} as Record<keyof OxAccountPermissions, true>;

export function CheckRolePermission(roleName: OxAccountRole | null, permission: keyof OxAccountPermissions) {
  if (!roleName) return;

  return accountRoles?.[roleName.toLowerCase()]?.[permission];
}

export async function CanPerformAction(
  player: OxPlayer,
  accountId: number,
  role: OxAccountRole | null,
  action: keyof OxAccountPermissions
) {
  if (CheckRolePermission(role, action)) return true;

  const groupName = (await SelectAccount(accountId))?.group;

  if (groupName) {
    if (action in blacklistedGroupActions) return false;

    const group = GetGroup(groupName);
    const groupRole = group.accountRoles[player.getGroup(groupName)];

    if (CheckRolePermission(groupRole, action)) return true;
  }

  return false;
}

async function LoadRoles() {
  const roles = await db.execute<OxAccountMetadataRow>(`SELECT * FROM account_roles`);

  if (!roles[0]) return;

  roles.forEach((role) => {
    const roleName = (role.name as string).toLowerCase() as OxAccountRole;
    delete role.name;
    delete role.id;

    accountRoles[roleName] = role;
    GlobalState[`accountRole.${roleName}`] = role;
  });

  GlobalState[`accountRoles`] = Object.keys(accountRoles);
}

setImmediate(LoadRoles);
