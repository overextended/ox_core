export type AccountRoles = 'contributor' | 'manager' | 'owner';

export interface AccountPermissions {
  view?: boolean;
  deposit?: boolean;
  withdraw?: boolean;
  delete?: boolean;
  addUser?: boolean;
  removeUser?: boolean;
  manageUser?: boolean;
  transferOwnership?: boolean;
}

const accountRoles = {} as Record<AccountRoles, AccountPermissions>;

function AddAccountRole(name: AccountRoles, permissions: AccountPermissions, extend?: AccountRoles) {
  if (extend) Object.assign(permissions, accountRoles[extend]);

  accountRoles[name] = permissions;
}

export function CheckRolePermission(roleName: AccountRoles | null, permission: keyof AccountPermissions) {
  if (!roleName) return;

  return accountRoles?.[roleName]?.[permission];
}

AddAccountRole('contributor', {
  view: true,
  deposit: true,
});

AddAccountRole(
  'manager',
  {
    withdraw: true,
    delete: true,
    addUser: true,
    removeUser: true,
  },
  'contributor'
);

AddAccountRole(
  'owner',
  {
    manageUser: true,
    transferOwnership: true,
  },
  'manager'
);
