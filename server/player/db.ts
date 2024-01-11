import { CHARACTER_SLOTS } from '../../common/config';
import { MySqlRow, OkPacket, db } from '../db';

export async function GetUserIdFromIdentifier(identifier: string, offset?: number) {
  using conn = await db.getConnection();
  const resp: { userId: number }[] = await conn.execute('SELECT userId FROM users WHERE license2 = ? LIMIT ?, 1', [
    identifier,
    offset || 0,
  ]);

  return db.scalar(resp);
}

export async function CreateUser(username: string, identifiers: Dict<string>) {
  using conn = await db.getConnection();
  const resp: OkPacket = await conn.execute(
    'INSERT INTO users (username, license2, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)',
    [username, identifiers.license2, identifiers.steam, identifiers.fivem, identifiers.discord]
  );

  return Number(resp.insertId);
}

export async function IsStateIdAvailable(stateId: string) {
  using conn = await db.getConnection();
  const resp: MySqlRow<number>[] = await conn.execute('SELECT 1 FROM characters WHERE stateId = ?', [stateId]);

  return !db.scalar(resp);
}

export async function CreateCharacter(
  userId: number,
  stateId: string,
  firstName: string,
  lastName: string,
  gender: string,
  date: number,
  phoneNumber?: number
) {
  using conn = await db.getConnection();
  const resp: OkPacket = await conn.execute(
    'INSERT INTO characters (userId, stateId, firstName, lastName, gender, dateOfBirth, phoneNumber) VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?)',
    [userId, stateId, firstName, lastName, gender, date / 1000, phoneNumber]
  );
  const charId = Number(resp.insertId);
  await conn.execute('INSERT INTO character_inventory (charId) VALUES (?)', [charId]);

  return charId;
}

export async function GetCharacters(userId: number) {
  using conn = await db.getConnection();
  const resp = conn.execute<Character[]>(
    'SELECT charId, stateId, firstName, lastName, x, y, z, heading, DATE_FORMAT(lastPlayed, "%d/%m/%Y") AS lastPlayed FROM characters WHERE userId = ? AND deleted IS NULL LIMIT ?',
    [userId, CHARACTER_SLOTS]
  );

  return resp;
}

export async function SaveCharacterData(values: any[] | any[][], batch?: boolean) {
  using conn = await db.getConnection();
  const query =
    'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, isDead = ?, lastPlayed = CURRENT_DATE(), health = ?, armour = ?, statuses = ? WHERE charId = ?';

  if (batch) await conn.batch(query, values);
  else await conn.execute(query, values);
}

export async function DeleteCharacter(charId: number) {
  using conn = await db.getConnection();
  const resp: OkPacket = await conn.execute('UPDATE characters SET deleted = curdate() WHERE charId = ?', [charId]);

  return resp.affectedRows === 1;
}

export async function GetCharacterMetadata(charId: number) {
  using conn = await db.getConnection();
  const resp = await conn.execute(
    'SELECT isDead, gender, DATE_FORMAT(dateOfBirth, "%d/%m/%Y") AS dateOfBirth, phoneNumber, health, armour, statuses FROM characters WHERE charId = ?',
    [charId]
  );

  return db.single(resp) as {
    isDead: boolean;
    gender: string;
    dateOfBirth: string;
    phoneNumber: string;
    health: number;
    armour: number;
    statuses: object;
  };
}
