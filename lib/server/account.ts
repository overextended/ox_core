import type { OxAccount as _OxAccount } from 'server/accounts/class';

class AccountInterface {
  constructor(public accountId: number) {}
}

Object.keys(exports.ox_core.GetAccountCalls()).forEach((method: string) => {
  (AccountInterface.prototype as any)[method] = function (...args: any[]) {
    return exports.ox_core.CallAccount(this.accountId, method, ...args);
  };
});

AccountInterface.prototype.toString = function () {
  return JSON.stringify(this, null, 2);
};

export type OxAccount = _OxAccount & AccountInterface;

function CreateAccountInstance(account?: _OxAccount) {
  if (!account) return;

  return new AccountInterface(account.accountId) as OxAccount;
}

export async function GetAccount(accountId: number) {
  const account = await exports.ox_core.GetAccount(accountId);
  return CreateAccountInstance(account);
}

export async function GetCharacterAccount(charId: number | string) {
  const account = await exports.ox_core.GetCharacterAccount(charId);
  return CreateAccountInstance(account);
}

export async function GetGroupAccount(groupName: string) {
  const account = await exports.ox_core.GetGroupAccount(groupName);
  return CreateAccountInstance(account);
}

export async function CreateAccount(owner: number | string, label: string) {
  const account = await exports.ox_core.CreateAccount(owner, label);
  return CreateAccountInstance(account);
}
