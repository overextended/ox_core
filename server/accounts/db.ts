import { OxAccount } from 'accounts';
import { OkPacket, db } from 'db';

const addBalance = `UPDATE accounts SET balance = balance + ? WHERE id = ?`;
const removeBalance = `UPDATE accounts SET balance = balance - ? WHERE id = ?`;
const safeRemoveBalance = `${removeBalance} AND (balance - ?) >= 0`;

export async function UpdateBalance(id: number, amount: number, action: 'add' | 'remove', overdraw?: boolean) {
  return (
    (await db.update(action === 'add' ? addBalance : overdraw ? removeBalance : safeRemoveBalance, [amount, id])) === 1
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

export function SelectAccounts(column: 'owner' | 'group' | 'id', id: string | number) {
  return db.execute<OxAccount[]>(`SELECT * FROM accounts WHERE ${column} = ?`, [id]);
}

export async function SelectAccount(id: string | number) {
  return db.single(await SelectAccounts('id', id));
}

export function CreateNewAccount(column: 'owner' | 'group', id: string | number, label: string, shared?: boolean) {
  return db.insert(`INSERT INTO accounts (label, ${column}, type) VALUES (?, ?, ?)`, [
    label,
    id,
    shared ? 'shared' : 'personal',
  ]);
}
