import { ClassInterface } from 'classInterface';
import { OxPlayer } from 'player/class';
import { GetCharIdFromStateId } from 'player/db';
import { Dict, OxAccountMetadata, OxAccountRole, OxAccountPermissions, OxCreateInvoice } from 'types';
import {
  SelectAccount,
  UpdateBalance,
  PerformTransaction,
  DepositMoney,
  WithdrawMoney,
  DeleteAccount,
  SelectAccountRole,
  UpdateAccountAccess,
  SetAccountType,
  CreateInvoice,
} from './db';
import { CanPerformAction } from './roles';

interface UpdateAccountBalance {
  amount: number;
  message?: string;
}

interface RemoveAccountBalance extends UpdateAccountBalance {
  overdraw?: boolean;
}

interface TransferAccountBalance {
  toId: number;
  amount: number;
  overdraw?: boolean;
  message?: string;
  note?: string;
  actorId?: number;
}

export class OxAccount extends ClassInterface {
  balance: number;
  isDefault: boolean;
  label: string;
  type: 'personal' | 'shared' | 'group';
  owner?: number;
  group?: string;
  ownerName?: string;
  role?: OxAccountRole;

  protected static members: Dict<OxAccount> = {};

  static async get(accountId: number) {
    if (accountId in this.members) return this.members[accountId];

    const validAccount = await SelectAccount(accountId);

    if (!validAccount) throw new Error(`No account exists with accountId ${accountId}.`);
    OxAccount.add(accountId, validAccount);

    return new OxAccount(accountId);
  }

  static getAll() {
    return this.members;
  }

  constructor(public accountId: number) {
    super();
    const account = OxAccount.members[accountId]
    if (account.owner) {
      const player = OxPlayer.getFromCharId(account.owner)
      account.ownerName = player && player.get('firstName') + ' ' + player.get('lastName')
    }
    this.balance = account.balance
    this.isDefault = account.isDefault
    this.label = account.label
    this.type = account.type
    this.group = account.group
    this.owner = account.owner
    this.ownerName = account.ownerName
  }

  /**
   * Get the value of specific key(s) from account metadata.
   */
  async get<T extends keyof OxAccountMetadata>(key: T): Promise<OxAccountMetadata[T]>;
  async get<T extends keyof OxAccountMetadata>(keys: T[]): Promise<Pick<OxAccountMetadata, T>>;
  async get<T extends keyof OxAccountMetadata>(
    keys: T | T[]
  ): Promise<OxAccountMetadata[T] | Pick<OxAccountMetadata, T> | null> {
    const metadata = await SelectAccount(this.accountId);

    if (!metadata) return null;

    if (Array.isArray(keys))
      return keys.reduce(
        (acc, key) => {
          acc[key] = metadata[key];
          return acc;
        },
        {} as Pick<OxAccountMetadata, T>
      );

    return metadata[keys];
  }

  /**
   * Add funds to the account.
   */
  async addBalance({ amount, message }: UpdateAccountBalance) {
    return UpdateBalance(this.accountId, amount, 'add', false, message);
  }

  /**
   * Remove funds from the account.
   */
  async removeBalance({ amount, overdraw = false, message }: RemoveAccountBalance) {
    return UpdateBalance(this.accountId, amount, 'remove', overdraw, message);
  }

  /**
   * Transfer funds to another account.
   */
  async transferBalance({ toId, amount, overdraw = false, message, note, actorId }: TransferAccountBalance) {
    return PerformTransaction(this.accountId, toId, amount, overdraw, message, note, actorId);
  }

  /**
   * Deposit money into the account.
   */
  async depositMoney(playerId: number, amount: number, message?: string, note?: string) {
    return DepositMoney(playerId, this.accountId, amount, message, note);
  }

  /**
   * Withdraw money from the account.
   */
  async withdrawMoney(playerId: number, amount: number, message?: string, note?: string) {
    return WithdrawMoney(playerId, this.accountId, amount, message, note);
  }

  /**
   * Mark the account as deleted. It can no longer be accessed, but remains in the database.
   */
  async deleteAccount() {
    return DeleteAccount(this.accountId);
  }

  /**
   * Get the account access role of a character by charId or stateId.
   */
  async getCharacterRole(id: number | string) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
    return charId ? SelectAccountRole(this.accountId, charId) : null;
  }

  /**
   * Set the account access role of a character by charId or stateId.
   */
  async setCharacterRole(id: number | string, role?: OxAccountRole) {
    const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
    return charId && UpdateAccountAccess(this.accountId, charId, role);
  }

  async playerHasPermission(playerId: number, permission: keyof OxAccountPermissions) {
    const player = OxPlayer.get(playerId);

    if (!player?.charId) return false;

    const role = await this.getCharacterRole(player.charId);
    return await CanPerformAction(player, this.accountId, role, permission);
  }

  async setShared() {
    return SetAccountType(this.accountId, 'shared');
  }

  async createInvoice(data: Omit<OxCreateInvoice, 'fromAccount'>) {
    const invoice = {
      fromAccount: this.accountId,
      ...data,
    };

    return await CreateInvoice(invoice);
  }
}

OxAccount.init();
