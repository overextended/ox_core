import { Connection, GetConnection, db } from 'db';
import { OxPlayer } from 'player/class';
import type { OxAccount, OxAccountInvoice, OxAccountRole, OxCreateInvoice } from 'types';
import locales from '../../common/locales';
import { getRandomInt } from '@overextended/ox_lib';
import { CanPerformAction } from './roles';
import { GetAccountById } from 'accounts';

const addBalance = `UPDATE accounts SET balance = balance + ? WHERE id = ?`;
const removeBalance = `UPDATE accounts SET balance = balance - ? WHERE id = ?`;
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;
const addTransaction = `INSERT INTO accounts_transactions (actorId, fromId, toId, amount, message, note, fromBalance, toBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
const getBalance = `SELECT balance FROM accounts WHERE id = ?`;
const doesAccountExist = `SELECT 1 FROM accounts WHERE id = ?`;
const getCharacterAccounts = `SELECT access.role, account.*, CONCAT(c.firstName, " ", c.lastName) as ownerName
  FROM \`accounts_access\` access
  LEFT JOIN accounts account ON account.id = access.accountId
  LEFT JOIN characters c ON account.owner = c.charId
  WHERE access.charId = ? AND account.type != 'inactive'`;
const getOwnedCharacterAccounts = `${getCharacterAccounts} AND access.role = 'owner'`;

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
  note?: string
) {
  amount = parseInt(String(amount));

  if (isNaN(amount)) return console.error(`Amount is not a number`);

  using conn = await GetConnection();
  const balance = await conn.scalar<number>(getBalance, [id]);

  if (balance === null) return 'no_balance';

  const addAction = action === 'add';
  const success = addAction
    ? await conn.update(addBalance, [amount, id])
    : await conn.update(overdraw ? removeBalance : safeRemoveBalance, [amount, id, amount]);

  return (
    success &&
    (await conn.update(addTransaction, [
      null,
      addAction ? null : id,
      addAction ? id : null,
      amount,
      message,
      note,
      addAction ? null : balance + amount,
      addAction ? balance + amount : null,
    ])) === 1
  );
}

export async function PerformTransaction(
  fromId: number,
  toId: number,
  amount: number,
  overdraw: boolean,
  message?: string,
  note?: string,
  actorId?: number
) {
  amount = parseInt(String(amount));

  if (isNaN(amount)) return console.error(`Amount is not a number`);

  using conn = await GetConnection();

  const fromBalance = await conn.scalar<number>(getBalance, [fromId]);
  const toBalance = await conn.scalar<number>(getBalance, [toId]);

  if (fromBalance === null || toBalance === null) return 'no_balance';

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

      return true;
    }
  } catch (e) {
    console.error(`Failed to transfer $${amount} from account<${fromId}> to account<${toId}>`);
    console.log(e);
  }

  conn.rollback();

  return false;
}

export async function SelectAccounts(column: 'owner' | 'group' | 'id', id: number | string) {
  return db.execute<OxAccount>(`SELECT * FROM accounts WHERE \`${column}\` = ?`, [id]);
}

export async function SelectDefaultAccount(column: 'owner' | 'group' | 'id', id: number | string) {
  return await db.row<OxAccount>(`SELECT * FROM accounts WHERE \`${column}\` = ? AND isDefault = 1`, [id]);
}

export async function SelectAccount(id: number) {
  return db.single(await SelectAccounts('id', id));
}

export async function SelectAllAccounts(id: number, includeAll?: boolean) {
  return await db.execute<OxAccount>(includeAll ? getCharacterAccounts : getOwnedCharacterAccounts, [id]);
}

export async function IsAccountIdAvailable(id: number) {
  return !(await db.exists(doesAccountExist, [id]));
}

export async function CreateNewAccount(
  column: 'owner' | 'group',
  id: string | number,
  label: string,
  shared?: boolean,
  isDefault?: boolean
) {
  using conn = await GetConnection();

  const accountId = await GenerateAccountId(conn);
  const result = await conn.update(
    `INSERT INTO accounts (id, label, \`${column}\`, type, isDefault) VALUES (?, ?, ?, ?, ?)`,
    [accountId, label, id, shared ? 'shared' : 'personal', isDefault || 0]
  );

  if (result && typeof id === 'number')
    conn.execute(`INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?)`, [accountId, id, 'owner']);

  return accountId;
}

export function DeleteAccount(accountId: number) {
  return db.update(`UPDATE accounts SET \`type\` = 'inactive' WHERE id = ?`, [accountId]);
}

const selectAccountRole = `SELECT role FROM accounts_access WHERE accountId = ? AND charId = ?`;

export function SelectAccountRole(accountId: number, charId: number) {
  return db.column<OxAccount['role']>(selectAccountRole, [accountId, charId]);
}

export async function DepositMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string
) {
  amount = parseInt(String(amount));

  if (isNaN(amount)) return console.error(`Amount is not a number`);

  const player = OxPlayer.get(playerId);

  if (!player?.charId) return 'no_charId';

  const money = exports.ox_inventory.GetItemCount(playerId, 'money');

  if (amount > money) return 'insufficient_funds';

  using conn = await GetConnection();
  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return 'no_balance';

  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'deposit'))) return 'no_access';

  await conn.beginTransaction();

  const affectedRows = await conn.update(addBalance, [amount, accountId]);

  if (!affectedRows || !exports.ox_inventory.RemoveItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
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

  return true;
}

export async function WithdrawMoney(
  playerId: number,
  accountId: number,
  amount: number,
  message?: string,
  note?: string
) {
  amount = parseInt(String(amount));

  if (isNaN(amount)) return console.error(`Amount is not a number`);

  const player = OxPlayer.get(playerId);

  if (!player?.charId) return 'no_charId';

  using conn = await GetConnection();
  const role = await conn.scalar<OxAccountRole>(selectAccountRole, [accountId, player.charId]);

  if (!(await CanPerformAction(player, accountId, role, 'withdraw'))) return 'no_access';

  const balance = await conn.scalar<number>(getBalance, [accountId]);

  if (balance === null) return 'no_balance';

  await conn.beginTransaction();

  const affectedRows = await conn.update(safeRemoveBalance, [amount, accountId, amount]);

  if (!affectedRows || !exports.ox_inventory.AddItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
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

  return true;
}

export function UpdateAccountAccess(accountId: number, id: number, role?: string) {
  if (!role) return db.update(`DELETE FROM accounts_access WHERE accountId = ? AND charId = ?`, [accountId, id]);

  return db.update(
    `INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [accountId, id, role]
  );
}

export async function UpdateInvoice(invoiceId: number, playerId: number) {
  const player = OxPlayer.get(playerId);

  if (!player?.charId) return 'no_charId';

  const invoice = await db.row<{ amount: number; payerId?: number; toId: number }>(
    'SELECT `amount`, `payerId`, `toId` FROM `accounts_invoices` WHERE `id` = ?',
    [invoiceId]
  );

  if (!invoice) return 'no_invoice';

  if (invoice.payerId) return 'invoice_paid';

  const hasPermission = await player.hasAccountPermission(invoice.toId, 'payInvoice');

  if (!hasPermission) return 'no_permission';

  const account = (await GetAccountById(invoice.toId))!;

  if (account.balance > invoice.amount) return 'insufficient_balance';

  return db.update('UPDATE `accounts_invoices` SET `payerId` = ?, `paidAt` = ? WHERE `id` = ?', [
    player.charId,
    new Date(),
    invoiceId,
  ]);
}

export async function CreateInvoice(invoice: OxCreateInvoice) {
  const player = OxPlayer.get(invoice.creatorId);

  if (!player?.charId) return 'no_charId';

  const hasPermission = await player.hasAccountPermission(invoice.fromId, 'sendInvoice');

  if (!hasPermission) return 'no_permission';

  const targetAccount = await GetAccountById(invoice.toId);

  if (!targetAccount) return 'no_target_account';

  return db.insert(
    'INSERT INTO accounts_invoices (`creatorId`, `fromId`, `toId`, `amount`, `message`, `dueDate`) VALUES (?, ?, ?, ?, ?, ?)',
    [invoice.creatorId, invoice.fromId, invoice.toId, invoice.amount, invoice.message, invoice.dueDate]
  );
}

export async function DeleteInvoice(invoiceId: number) {
  return db.update('DELETE FROM `accounts_invoices` WHERE `id` = ?', [invoiceId]);
}
