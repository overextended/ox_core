import { OxAccount } from 'accounts';
import { MySqlRow, OkPacket, db } from 'db';
import { OxPlayer } from 'player/class';

const addBalance = `UPDATE accounts SET balance = balance + ? WHERE id = ?`;
const removeBalance = `UPDATE accounts SET balance = balance - ? WHERE id = ?`;
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;

export async function UpdateBalance(id: number, amount: number, action: 'add' | 'remove', overdraw?: boolean) {
  return (
    (await db.update(action === 'add' ? addBalance : overdraw ? removeBalance : safeRemoveBalance, [
      amount,
      id,
      amount,
    ])) === 1
  );
}

export async function PerformTransaction(fromId: number, toId: number, amount: number, overdraw?: boolean) {
  using conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const a =
      (await conn.execute<OkPacket>(overdraw ? removeBalance : safeRemoveBalance, [amount, fromId, amount]))
        .affectedRows === 1;

    const b = (await conn.execute<OkPacket>(addBalance, [amount, toId])).affectedRows === 1;

    if (a && b) {
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
  return db.execute<OxAccount[]>(`SELECT * FROM accounts WHERE ${column} = ?`, [id]);
}

export async function SelectDefaultAccount(column: 'owner' | 'group' | 'id', id: number | string) {
  return await db.row<OxAccount>(`SELECT * FROM accounts WHERE ${column} = ? AND isDefault = 1`, [id]);
}

export async function SelectAccount(id: number) {
  return db.single(await SelectAccounts('id', id));
}

export function CreateNewAccount(column: 'owner' | 'group', id: string | number, label: string, shared?: boolean) {
  return db.insert(`INSERT INTO accounts (label, ${column}, type) VALUES (?, ?, ?)`, [
    label,
    id,
    shared ? 'shared' : 'personal',
  ]);
}

//@todo permission system
const isAccountOwner = `SELECT 1 FROM accounts WHERE id = ? AND owner = ?`;

export function IsAccountOwner(playerId: number, accountId: number) {
  const charId = OxPlayer.get(playerId)?.charId;

  if (!charId) return;

  return db.exists(isAccountOwner, [accountId, charId]);
}

export async function DepositMoney(playerId: number, accountId: number, amount: number) {
  const charId = OxPlayer.get(playerId)?.charId;

  if (!charId) return;

  const money = exports.ox_inventory.GetItemCount(playerId, 'money');

  if (amount > money) return;

  using conn = await db.getConnection();

  if (!db.scalar(await conn.execute<MySqlRow<number>[]>(isAccountOwner, [accountId, charId]))) return;

  await conn.beginTransaction();
  const success = (await conn.execute<OkPacket>(addBalance, [amount, accountId])).affectedRows;

  if (!success || !exports.ox_inventory.RemoveItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
  }

  conn.commit();
  return true;
}

export async function WithdrawMoney(playerId: number, accountId: number, amount: number) {
  const charId = OxPlayer.get(playerId)?.charId;

  if (!charId) return;

  using conn = await db.getConnection();

  if (!db.scalar(await conn.execute<MySqlRow<number>[]>(isAccountOwner, [accountId, charId]))) return;

  await conn.beginTransaction();

  const success = (await conn.execute<OkPacket>(safeRemoveBalance, [amount, accountId, amount])).affectedRows;

  if (!success || !exports.ox_inventory.AddItem(playerId, 'money', amount)) {
    conn.rollback();
    return false;
  }

  conn.commit();
  return true;
}
