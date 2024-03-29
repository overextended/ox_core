import { db } from 'db';
import { OxPlayer } from 'player/class';
import type { OxAccount } from 'types';
import locales from '../../common/locales';

const addBalance = `UPDATE accounts SET balance = balance + ? WHERE id = ?`;
const removeBalance = `UPDATE accounts SET balance = balance - ? WHERE id = ?`;
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;
const addTransaction = `INSERT INTO accounts_transactions (fromId, toId, amount, message) VALUES (?, ?, ?, ?)`;

export async function UpdateBalance(id: number, amount: number, action: 'add' | 'remove', overdraw: boolean, message?: string) {
  return (
    (await db.update(action === 'add' ? addBalance : overdraw ? removeBalance : safeRemoveBalance, [
      amount,
      id,
      amount,
    ])) === 1 &&
    (await db.insert(addTransaction, [action === 'add' ? null : id, action === 'add' ? id : null, amount, message])) === 1
  );
}

export async function PerformTransaction(fromId: number, toId: number, amount: number, overdraw: boolean, message?: string) {
  using conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const a =
      (await conn.execute(overdraw ? removeBalance : safeRemoveBalance, [amount, fromId, amount])).affectedRows === 1;

    const b = (await conn.execute(addBalance, [amount, toId])).affectedRows === 1;

    if (a && b) {
      await conn.execute(addTransaction, [fromId, toId, amount, message]);
      await conn.commit();
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

export async function SelectAllAccounts(id: number) {
  return await db.execute<OxAccount>(
    'SELECT ac.role, a.* FROM `accounts_access` ac LEFT JOIN accounts a ON a.id = ac.accountId WHERE ac.charId = ?',
    [id]
  );
}

export async function CreateNewAccount(
  column: 'owner' | 'group',
  id: string | number,
  label: string,
  shared?: boolean,
  isDefault?: boolean
) {
  const accountId = await db.insert(`INSERT INTO accounts (label, \`${column}\`, type, isDefault) VALUES (?, ?, ?, ?)`, [
    label,
    id,
    shared ? 'shared' : 'personal',
    isDefault || 0,
  ]);

  if (accountId)
    db.insert(`INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?)`, [accountId, id, 'owner']);

  return accountId;
}

export function DeleteAccount(accountId: number) {
  return db.update(`DELETE FROM accounts WHERE id = ?`, [accountId]);
}

const selectAccountRole = `SELECT role FROM accounts_access WHERE accountId = ? AND charId = ?`;

export function SelectAccountRole(accountId: number, charId: number) {
  return db.column<OxAccount['role']>(selectAccountRole, [accountId, charId]);
}

export async function DepositMoney(playerId: number, accountId: number, amount: number) {
  const { charId } = OxPlayer.get(playerId);

  if (!charId) return;

  const money = exports.ox_inventory.GetItemCount(playerId, 'money');

  if (amount > money) return;

  using conn = await db.getConnection();

  const role = db.scalar<string>(await conn.execute(selectAccountRole, [accountId, charId]));

  if (role !== 'owner') return;

  await conn.beginTransaction();

  const { affectedRows } = await conn.execute(addBalance, [amount, accountId]);

  if (!affectedRows || !exports.ox_inventory.RemoveItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
  }

  await conn.execute(addTransaction, [null, accountId, amount, locales('deposit')]);
  conn.commit();
  return true;
}

export async function WithdrawMoney(playerId: number, accountId: number, amount: number) {
  const { charId } = OxPlayer.get(playerId);

  if (!charId) return;

  using conn = await db.getConnection();

  const role = db.scalar<string>(await conn.execute(selectAccountRole, [accountId, charId]));

  if (role !== 'owner' && role !== 'manager') return;

  await conn.beginTransaction();

  const { affectedRows } = await conn.execute(safeRemoveBalance, [amount, accountId, amount]);

  if (!affectedRows || !exports.ox_inventory.AddItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
  }

  await conn.execute(addTransaction, [accountId, null, amount, locales('withdraw')]);
  conn.commit();
  return true;
}

export function UpdateAccountAccess(accountId: number, id: number, role?: string) {
  if (!role) return db.update(`DELETE FROM accounts_access WHERE accountId = ? AND charId = ?`, [accountId, id]);

  return db.update(
    `INSERT INTO accounts_access (accountId, charId, role) VALUE (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [accountId, id, role]
  );
}
