import {
  CreateNewAccount,
  DeleteAccount,
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

export function GetAccountById(id: number) {
  return SelectAccount(id);
}

export async function GetCharacterAccount(id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId ? SelectDefaultAccount('owner', charId) : null;
}

export async function GetGroupAccount(group: string) {
  return SelectDefaultAccount('group', group);
}

export async function GetCharacterAccounts(id: number | string, includeAll?: boolean) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return (charId && (includeAll ? SelectAllAccounts(charId) : SelectAccounts('owner', id))) || null;
}

export function GetGroupAccounts(group: string) {
  return SelectAccounts('group', group);
}

export function AddAccountBalance(id: number, amount: number, message?: string) {
  return UpdateBalance(id, amount, 'add', false, message);
}

export function RemoveAccountBalance(id: number, amount: number, overdraw = false, message?: string) {
  return UpdateBalance(id, amount, 'remove', overdraw, message);
}

export function TransferAccountBalance(fromId: number, toId: number, amount: number, overdraw = false, message?: string) {
  return PerformTransaction(fromId, toId, amount, overdraw, message);
}

export function CreateAccount(charId: number, label: string, shared?: boolean) {
  return CreateNewAccount('owner', charId, label, shared);
}

export function CreateGroupAccount(group: string, label: string, shared?: boolean) {
  return CreateNewAccount('group', group, label, shared);
}

export async function GetAccountRole(accountId: number, id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId && SelectAccountRole(accountId, charId) || null;
}

export async function SetAccountAccess(accountId: number, id: number | string, role: string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId && UpdateAccountAccess(accountId, charId, role);
}

export async function RemoveAccountAccess(accountId: number, id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId && UpdateAccountAccess(accountId, charId);
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
exports('DeleteAccount', DeleteAccount);
exports('GetAccountRole', GetAccountRole);
exports('DepositMoney', DepositMoney);
exports('WithdrawMoney', WithdrawMoney);
exports('SetAccountAccess', SetAccountAccess);
exports('RemoveAccountAccess', RemoveAccountAccess);
