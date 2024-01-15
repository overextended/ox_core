import { OxPlayer } from 'player/class';
import { PerformTransaction, SelectAccount, SelectAccounts, UpdateBalance } from './db';

export interface OxAccount {
  id: number;
  accountId: string;
  balance: number;
  isDefault: boolean;
  label?: string;
  owner?: number;
  group?: string;
}

export function GetAccountById(id: number): Promise<OxAccount | void> {
  return SelectAccount(id);
}

export function GetPlayerAccounts(playerId: number): Promise<OxAccount[] | void> {
  const player = OxPlayer.get(playerId);

  if (player?.charId) return SelectAccounts('owner', player.charId);
}

export function GetCharacterAccounts(charId: number): Promise<OxAccount[] | void> {
  return SelectAccounts('owner', charId);
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

exports('GetAccountById', GetAccountById);
exports('GetPlayerAccounts', GetPlayerAccounts);
exports('GetCharacterAccounts', GetCharacterAccounts);
exports('GetGroupAccounts', GetGroupAccounts);
exports('AddAccountBalance', AddAccountBalance);
exports('RemoveAccountBalance', RemoveAccountBalance);
exports('TransferAccountBalance', TransferAccountBalance);
