import { OkPacket, db } from 'db';

export async function SelectGroups() {
  using conn = await db.getConnection();
  return await conn.query('SELECT * FROM ox_groups');
}

export async function AddCharacterGroup(charId: number, name: string, grade: number) {
  using conn = await db.getConnection();
  return (
    (
      await conn.execute<OkPacket>('INSERT INTO character_groups (charId, name, grade) VALUES (?, ?, ?)', [
        charId,
        name,
        grade,
      ])
    ).affectedRows === 1
  );
}

export async function UpdateCharacterGroup(charId: number, name: string, grade: number) {
  using conn = await db.getConnection();
  return (
    (
      await conn.execute<OkPacket>('UPDATE character_groups SET grade = ? WHERE charId = ? AND name = ?', [
        grade,
        charId,
        name,
      ])
    ).affectedRows === 1
  );
}

export async function RemoveCharacterGroup(charId: number, name: string) {
  using conn = await db.getConnection();
  return (
    (await conn.execute<OkPacket>('DELETE FROM character_groups WHERE charId = ? AND name = ?', [charId, name]))
      .affectedRows === 1
  );
}

export async function LoadCharacterGroups(charId: number) {
  using conn = await db.getConnection();
  return await conn.execute<{ name: string; grade: number }[]>(
    'SELECT name, grade FROM character_groups WHERE charId = ?',
    [charId]
  );
}
