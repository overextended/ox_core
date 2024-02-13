import {
  CreateNewAccount,
  DepositMoney,
  SelectAccountRole,
  PerformTransaction,
  UpdateAccountAccess,
  SelectAccount,
  SelectAccounts,
  SelectAllAccounts,
  SelectDefaultAccount,
  UpdateBalance,
  WithdrawMoney,
} from './db';
import { GetCharIdFromStateId } from 'player/db';

export interface OxAccount {
  id: number;
  balance: number;
  isDefault: boolean;
  label?: string;
  owner?: number;
  group?: string;
  type: 'personal' | 'shared' | 'group';
}

export function GetAccountById(id: number): Promise<OxAccount | void> {
  return SelectAccount(id);
}

export async function GetCharacterAccount(id: number | string): Promise<OxAccount | void> {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return SelectDefaultAccount('owner', id);
}

export async function GetGroupAccount(group: string): Promise<OxAccount | void> {
  return SelectDefaultAccount('group', group);
}

export async function GetCharacterAccounts(id: number | string, includeAll?: boolean): Promise<OxAccount[] | void> {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return includeAll ? SelectAllAccounts(id) : SelectAccounts('owner', id);
}

export function GetGroupAccounts(group: string): Promise<OxAccount[] | void> {
  return SelectAccounts('group', group);
}

export function AddAccountBalance(id: number, amount: number): Promise<boolean> {
  return UpdateBalance(id, amount, 'add');
}

export function RemoveAccountBalance(id: number, amount: number, overdraw = false): Promise<boolean> {
  return UpdateBalance(id, amount, 'remove', overdraw);
}

export function TransferAccountBalance(
  fromId: number,
  toId: number,
  amount: number,
  overdraw = false
): Promise<boolean> {
  return PerformTransaction(fromId, toId, amount, overdraw);
}

export function CreateAccount(charId: number, label: string, shared?: boolean): Promise<number> {
  return CreateNewAccount('owner', charId, label, shared);
}

export function CreateGroupAccount(group: string, label: string, shared?: boolean): Promise<number> {
  return CreateNewAccount('group', group, label, shared);
}

export async function GetAccountRole(accountId: number, id: number | string) {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;

  return SelectAccountRole(accountId, id);
}

export async function SetAccountAccess(accountId: string, id: number | string, role: string) {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;

  return UpdateAccountAccess(accountId, id, role);
}

export async function RemoveAccountAccess(accountId: string, id: number | string) {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;

  return UpdateAccountAccess(accountId, id);
}

exports('GetAccountById', GetAccountById);
exports('GetCharacterAccount', GetCharacterAccount);
exports('GetGroupAccount', GetGroupAccount);
exports('GetCharacterAccounts', GetCharacterAccounts);
exports('GetGroupAccounts', GetGroupAccounts);
exports('AddAccountBalance', AddAccountBalance);
exports('RemoveAccountBalance', RemoveAccountBalance);
exports('TransferAccountBalance', TransferAccountBalance);
exports('CreateAccount', CreateAccount);
exports('CreateGroupAccount', CreateGroupAccount);
exports('GetAccountRole', GetAccountRole);
exports('DepositMoney', DepositMoney);
exports('WithdrawMoney', WithdrawMoney);
exports('SetAccountAccess', SetAccountAccess);
exports('RemoveAccountAccess', RemoveAccountAccess);
