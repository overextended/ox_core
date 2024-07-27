import { db } from 'db';
import type { OxAccountPermissions, OxAccountRoles } from 'types';
import { SelectAccount } from './db';
import { GetGroup } from 'groups';
import { OxPlayer } from 'player/class';

type DbAccountRow = OxAccountPermissions & { id?: number; name?: OxAccountRoles };

const accountRoles = {} as Record<string, OxAccountPermissions>;

export function CheckRolePermission(roleName: OxAccountRoles | null, permission: keyof OxAccountPermissions) {
  if (!roleName) return;

  return accountRoles?.[roleName.toLowerCase()]?.[permission];
}

export async function CanPerformAction(
  player: OxPlayer,
  accountId: number,
  role: OxAccountRoles | null,
  action: keyof OxAccountPermissions
) {
  if (CheckRolePermission(role, action)) return true;

  const groupName = (await SelectAccount(accountId))?.group;

  if (groupName) {
    const group = GetGroup(groupName);
    const groupRole = group.accountRoles[player.getGroup(groupName)];

    if (CheckRolePermission(groupRole, action)) return true;
  }

  return false;
}

async function LoadRoles() {
  const roles = await db.execute<DbAccountRow>(`SELECT * FROM account_roles`);

  if (!roles[0]) return;

  roles.forEach((role) => {
    const roleName = (role.name as string).toLowerCase() as OxAccountRoles;
    delete role.name;
    delete role.id;

    accountRoles[roleName] = role;
  });
}

setImmediate(LoadRoles);
