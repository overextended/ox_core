import { getRandomInt } from '@overextended/ox_lib';
import { OxAccount } from 'accounts/class';
import { Connection, GetConnection, db } from 'db';
import { OxPlayer } from 'player/class';
import type { OxAccountMetadata, OxAccountRole, OxAccountUserMetadata, OxCreateInvoice } from 'types';
import locales from '../../common/locales';
import { CanPerformAction } from './roles';

const addBalance = `UPDATE accounts SET balance = balance + ? WHERE id = ?`;
const removeBalance = `UPDATE accounts SET balance = balance - ? WHERE id = ?`;
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;
const addTransaction = `INSERT INTO accounts_transactions (actorId, fromId, toId, amount, message, note, fromBalance, toBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
const getBalance = `SELECT balance FROM accounts WHERE id = ?`;
const doesAccountExist = `SELECT 1 FROM accounts WHERE id = ?`;

async function GenerateAccountId(conn: Connection) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const baseId = Number(year + month) * 1e3;

  while (true) {
    const accountId = getRandomInt(10, 99) * 1e7 + baseId + getRandomInt(0, 9999);
    const existingId = await conn.scalar<number>(doesAccountExist, [accountId]);

    if (!existingId) return accountId;
  }
}

export async function UpdateBalance(
  id: number,
  amount: number,
  action: 'add' | 'remove',
  overdraw: boolean,
  message?: string,
  note?: string,
  actorId?: number
): Promise<{ success: boolean; message?: string }> {
  amount = parseInt(String(amount));

  if (isNaN(amount)) {
    console.error(`Amount is not a number`);

    return {
      success: false,
      message: 'amount_not_number',
    };
  }

  using conn = await GetConnection();
  const balance = await conn.scalar<number>(getBalance, [id]);

  if (balance === null)
    return {
      success: false,
      message: 'no_balance',
    };

  const addAction = action === 'add';
  const success = addAction
    ? await conn.update(addBalance, [amount, id])
    : await conn.update(overdraw ? removeBalance : safeRemoveBalance, [amount, id, amount]);

  const didUpdate =
    success &&
    (await conn.update(addTransaction, [
      actorId || null,
      addAction ? null : id,
      addAction ? id : null,
      amount,
      message,
      note,
      addAction ? null : balance - amount,
      addAction ? balance + amount : null,
    ])) === 1;

  if (!didUpdate)
    return {
      success: false,
      message: 'something_went_wrong',
    };

  return { success: true };
}

export async function PerformTransaction(
  fromId: number,
  toId: number,
  amount: number,
  overdraw: boolean,
  message?: string,
  note?: string,
  actorId?: number
): Promise<{ success: boolean; message?: string }> {
  amount = parseInt(String(amount));

  if (isNaN(amount)) {
    console.error(`Amount is not a number`);

    return { success: false, message: 'amount_not_number' };
  }

  using conn = await GetConnection();

  const fromBalance = await conn.scalar<number>(getBalance, [fromId]);
  const toBalance = await conn.scalar<number>(getBalance, [toId]);

  if (fromBalance === null || toBalance === null) return { success: false, message: 'no_balance' };

  await conn.beginTransaction();

  try {
    const removedBalance = await conn.update(overdraw ? removeBalance : safeRemoveBalance, [amount, fromId, amount]);
    const addedBalance = removedBalance && (await conn.update(addBalance, [amount, toId]));

    if (addedBalance) {
      await conn.execute(addTransaction, [
        actorId,
        fromId,
        toId,
        amount,
        message ?? locales('transfer'),
        note,
        fromBalance - amount,
        toBalance + amount,
      ]);

      return { success: true };
    }
  } catch (e) {
    console.error(`Failed to transfer $${amount} from account<${fromId}> to account<${toId}>`);
    console.log(e);
  }

  conn.rollback();

  return { success: false, message: 'something_went_wrong' };
}

export async function SelectAccounts(column: 'owner' | 'group' | 'id', id: number | string) {
  return db.execute<OxAccountMetadata>(`SELECT * FROM accounts WHERE \`${column}\` = ?`, [id]);
}

export async function SelectDefaultAccountId(column: 'owner' | 'group' | 'id', id: number | string) {
  return await db.column<number>(`SELECT id FROM accounts WHERE \`${column}\` = ? AND isDefault = 1`, [id]);
}

export async function SelectAccount(id: number) {
  return db.single(await SelectAccounts('id', id));
}

export async function IsAccountIdAvailable(id: number) {
  return !(await db.exists(doesAccountExist, [id]));
}

export async function CreateNewAccount(owner: string | number, label: string, isDefault?: boolean) {
  using conn = await GetConnection();

  const accountId = await GenerateAccountId(conn);
  const column = typeof owner === 'string' ? 'group' : 'owner';
  const result = await conn.update(
    `INSERT INTO accounts (id, label, \`${column}\`, type, isDefault) VALUES (?, ?, ?, ?, ?)`,
    [accountId, label, owner, column === 'group' ? 'group' : 'personal', isDefault || 0]
  );

  if (result && column === 'owner')
    conn.execute(`INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?)`, [accountId, owner, 'owner']);

  return accountId;
}

export async function DeleteAccount(accountId: number): Promise<{ success: boolean; message?: string }> {
  const success = await db.update(`UPDATE accounts SET \`type\` = 'inactive' WHERE id = ?`, [accountId]);

  if (!success)
    return {
      success: false,
      message: 'something_went_wrong',
    };

  return { success: true };
}

const selectAccountRole = `SELECT role FROM accounts_access WHERE accountId = ? AND charId = ?`;

export function SelectAccountRole(accountId: number, charId: number) {
  return db.column<OxAccountUserMetadata['role']>(selectAccountRole, [accountId, charId]);
}

export async function DepositMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string
): Promise<{ success: boolean; message?: string }> {
  amount = parseInt(String(amount));

  if (isNaN(amount)) {
    console.error(`Amount is not a number`);

    return { success: false, message: 'amount_not_number' };
  }

  const player = OxPlayer.get(playerId);

  if (!player?.charId)
    return {
      success: false,
      message: 'no_charid',
    };

  const money = exports.ox_inventory.GetItemCount(playerId, 'money');

  if (amount > money) return { success: false, message: 'insufficient_funds' };

  using conn = await GetConnection();
  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return { success: false, message: 'no_balance' };

  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'deposit'))) return { success: false, message: 'no_access' };

  await conn.beginTransaction();

  const affectedRows = await conn.update(addBalance, [amount, accountId]);

  if (!affectedRows || !exports.ox_inventory.RemoveItem(playerId, 'money', amount)) {
    conn.rollback();
    return {
      success: false,
      message: 'something_went_wrong',
    };
  }

  await conn.execute(addTransaction, [
    player.charId,
    null,
    accountId,
    amount,
    message ?? locales('deposit'),
    note,
    null,
    balance + amount,
  ]);

  return {
    success: true,
  };
}

export async function WithdrawMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string
): Promise<{ success: boolean; message?: string }> {
  amount = parseInt(String(amount));

  if (isNaN(amount)) {
    console.error(`Amount is not a number`);

    return { success: false, message: 'amount_not_number' };
  }

  const player = OxPlayer.get(playerId);

  if (!player?.charId) return { success: false, message: 'no_charId' };

  using conn = await GetConnection();
  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'withdraw'))) return { success: false, message: 'no_access' };

  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return { success: false, message: 'no_balance' };

  await conn.beginTransaction();

  const affectedRows = await conn.update(safeRemoveBalance, [amount, accountId, amount]);

  if (!affectedRows || !exports.ox_inventory.AddItem(playerId, 'money', amount)) {
    conn.rollback();
    return {
      success: false,
      message: 'something_went_wrong',
    };
  }

  await conn.execute(addTransaction, [
    player.charId,
    accountId,
    null,
    amount,
    message ?? locales('withdraw'),
    note,
    balance - amount,
    null,
  ]);

  return { success: true };
}

export async function UpdateAccountAccess(
  accountId: number,
  id: number,
  role?: string
): Promise<{ success: boolean; message?: string }> {
  if (!role) {
    const success = await db.update(`DELETE FROM accounts_access WHERE accountId = ? AND charId = ?`, [accountId, id]);

    if (!success) return { success: false, message: 'something_went_wrong' };

    return { success: true };
  }

  const success = await db.update(
    `INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [accountId, id, role]
  );

  if (!success) return { success: false, message: 'something_went_wrong' };

  return { success: true };
}

export async function UpdateInvoice(
  invoiceId: number,
  charId: number
): Promise<{ success: boolean; message?: string }> {
  const player = OxPlayer.getFromCharId(charId);

  if (!player?.charId) return { success: false, message: 'no_charId' };

  const invoice = await db.row<{ amount: number; payerId?: number; fromAccount: number; toAccount: number }>(
    'SELECT * FROM `accounts_invoices` WHERE `id` = ?',
    [invoiceId]
  );

  if (!invoice) return { success: false, message: 'no_invoice' };

  if (invoice.payerId) return { success: false, message: 'invoice_paid' };

  const account = await OxAccount.get(invoice.toAccount);
  const hasPermission = await account?.playerHasPermission(player.source as number, 'payInvoice');

  if (!hasPermission) return { success: false, message: 'no_permission' };

  const updateReceiver = await UpdateBalance(
    invoice.toAccount,
    invoice.amount,
    'remove',
    false,
    locales('invoice_payment'),
    undefined,
    charId
  );

  if (!updateReceiver.success) return { success: false, message: 'no_balance' };

  const updateSender = await UpdateBalance(
    invoice.fromAccount,
    invoice.amount,
    'add',
    false,
    locales('invoice_payment'),
    undefined,
    charId
  );

  if (!updateSender.success) return { success: false, message: 'no_balance' };

  const invoiceUpdated = await db.update('UPDATE `accounts_invoices` SET `payerId` = ?, `paidAt` = ? WHERE `id` = ?', [
    player.charId,
    new Date(),
    invoiceId,
  ]);

  if (!invoiceUpdated)
    return {
      success: false,
      message: 'invoice_not_updated',
    };

  invoice.payerId = charId;

  emit('ox:invoicePaid', invoice);

  return {
    success: true,
  };
}

export async function CreateInvoice(invoice: OxCreateInvoice): Promise<{ success: boolean; message?: string }> {
  if (invoice.actorId) {
    const player = OxPlayer.getFromCharId(invoice.actorId);

    if (!player?.charId) return { success: false, message: 'no_charid' };

    const account = await OxAccount.get(invoice.fromAccount);
    const hasPermission = await account?.playerHasPermission(player.source as number, 'sendInvoice');

    if (!hasPermission) return { success: false, message: 'no_permission' };
  }

  const targetAccount = await OxAccount.get(invoice.toAccount);

  if (!targetAccount) return { success: false, message: 'no_target_account' };

  const success = await db.insert(
    'INSERT INTO accounts_invoices (`actorId`, `fromAccount`, `toAccount`, `amount`, `message`, `dueDate`) VALUES (?, ?, ?, ?, ?, ?)',
    [invoice.actorId, invoice.fromAccount, invoice.toAccount, invoice.amount, invoice.message, invoice.dueDate]
  );

  if (!success) return { success: false, message: 'invoice_insert_error' };

  return { success: true };
}

export async function DeleteInvoice(invoiceId: number): Promise<{ success: boolean; message?: string }> {
  const success = await db.update('DELETE FROM `accounts_invoices` WHERE `id` = ?', [invoiceId]);

  if (!success) return { success: false, message: 'invoice_delete_error' };

  return { success: true };
}

export async function SetAccountType(accountId: number, type: string): Promise<{ success: boolean; message?: string }> {
  const success = await db.update('UPDATE `accounts` SET `type` = ? WHERE `id` = ?', [type, accountId]);

  if (!success) return { success: false, message: 'update_account_error' };

  return { success: true };
}
