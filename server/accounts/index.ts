import {
  CreateNewAccount,
  DeleteAccount,
  DepositMoney,
  PerformTransaction,
  UpdateAccountAccess,
  SelectAccount,
  SelectAccounts,
  SelectAllAccounts,
  SelectDefaultAccount,
  UpdateBalance,
  WithdrawMoney,
  GetAccountPermission,
} from './db';
import { GetCharIdFromStateId } from 'player/db';

export function GetAccountById(id: number) {
  return SelectAccount(id);
}

/**
 * Return the default account for a character.
 * @param id The charId or stateId used to identify the character.
 */
export async function GetCharacterAccount(id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId ? SelectDefaultAccount('owner', charId) : null;
}

/**
 * Return the default account for a group.
 */
export async function GetGroupAccount(group: string) {
  return SelectDefaultAccount('group', group);
}

/**
 * Returns an array of all accounts for a character.
 * @param id The charId or stateId used to identify the character.
 * @param includeAll If `true` the array will include all accounts the character can access.
 */
export async function GetCharacterAccounts(id: number | string, includeAll?: boolean) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return (charId && (includeAll ? SelectAllAccounts(charId) : SelectAccounts('owner', id))) || null;
}

/**
 * Returns an array of all accounts for a group.
 */
export function GetGroupAccounts(group: string) {
  return SelectAccounts('group', group);
}

interface UpdateAccountBalance {
  id: number;
  amount: number;
  message?: string;
}

export function AddAccountBalance({ id, amount, message }: UpdateAccountBalance) {
  return UpdateBalance(id, amount, 'add', false, message);
}

interface RemoveAccountBalance extends UpdateAccountBalance {
  overdraw?: boolean;
}

export function RemoveAccountBalance({ id, amount, overdraw = false, message }: RemoveAccountBalance) {
  return UpdateBalance(id, amount, 'remove', overdraw, message);
}

interface TransferAccountBalance {
  fromId: number;
  toId: number;
  amount: number;
  overdraw?: boolean;
  message?: string;
  note?: string;
  actorId?: number;
}

export function TransferAccountBalance({
  fromId,
  toId,
  amount,
  overdraw = false,
  message,
  note,
  actorId,
}: TransferAccountBalance) {
  return PerformTransaction(fromId, toId, amount, overdraw, message, note, actorId);
}

export function CreateAccount(charId: number, label: string, shared?: boolean) {
  return CreateNewAccount('owner', charId, label, shared);
}

export function CreateGroupAccount(group: string, label: string) {
  return CreateNewAccount('group', group, label, true);
}

export async function HasAccountAccess(accountId: number, id: number | string, permission: string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return (charId && GetAccountPermission(accountId, charId, permission)) || null;
}

export async function SetAccountAccess(accountId: number, id: number | string, permission: string, value: boolean) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return charId && UpdateAccountAccess(accountId, charId, permission, value);
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
exports('HasAccountAccess', HasAccountAccess);
exports('DepositMoney', DepositMoney);
exports('WithdrawMoney', WithdrawMoney);
exports('SetAccountAccess', SetAccountAccess);
exports('RemoveAccountAccess', RemoveAccountAccess);
