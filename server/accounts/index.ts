import { OxPlayer } from 'player/class';
import {
  CreateNewAccount,
  DepositMoney,
  GetAccountRole,
  IsAccountOwner,
  PerformTransaction,
  SelectAccount,
  SelectAccounts,
  SelectDefaultAccount,
  SetAccountAccess,
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

export function GetPlayerAccount(playerId: number): Promise<OxAccount | void> {
  const player = OxPlayer.get(playerId);

  if (player?.charId) return SelectDefaultAccount('owner', player.charId);
}

export async function GetCharacterAccount(id: number | string): Promise<OxAccount | void> {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return SelectDefaultAccount('owner', id);
}

export async function GetGroupAccount(group: string): Promise<OxAccount | void> {
  return SelectDefaultAccount('group', group);
}

export function GetPlayerAccounts(playerId: number): Promise<OxAccount[] | void> {
  const player = OxPlayer.get(playerId);

  if (player?.charId) return SelectAccounts('owner', player.charId);
}

export async function GetCharacterAccounts(id: number | string): Promise<OxAccount[] | void> {
  id = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  return SelectAccounts('owner', id);
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

exports('GetAccountById', GetAccountById);
exports('GetPlayerAccount', GetPlayerAccount);
exports('GetCharacterAccount', GetCharacterAccount);
exports('GetGroupAccount', GetGroupAccount);
exports('GetPlayerAccounts', GetPlayerAccounts);
exports('GetCharacterAccounts', GetCharacterAccounts);
exports('GetGroupAccounts', GetGroupAccounts);
exports('AddAccountBalance', AddAccountBalance);
exports('RemoveAccountBalance', RemoveAccountBalance);
exports('TransferAccountBalance', TransferAccountBalance);
exports('CreateAccount', CreateAccount);
exports('CreateGroupAccount', CreateGroupAccount);
exports('IsAccountOwner', IsAccountOwner);
exports('GetAccountRole', GetAccountRole);
exports('DepositMoney', DepositMoney);
exports('WithdrawMoney', WithdrawMoney);
exports('SetAccountAccess', SetAccountAccess);
