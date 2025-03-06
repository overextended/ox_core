import type { Character, Dict, OxStatus, CharacterLicense, OxLicense, BanDetails } from 'types';
import { CHARACTER_SLOTS } from '../../common/config';
import { db } from '../db';
import { OxPlayer } from './class';

export function GetUserIdFromIdentifier(identifier: string, offset?: number) {
  return db.column<number>('SELECT userId FROM users WHERE license2 = ? LIMIT ?, 1', [identifier, offset || 0]);
}

export function CreateUser(username: string, { license2, steam, fivem, discord }: Dict<string>) {
  return db.insert('INSERT INTO users (username, license2, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)', [
    username,
    license2,
    steam,
    fivem,
    discord,
  ]);
}

export async function IsStateIdAvailable(stateId: string) {
  return !(await db.exists('SELECT 1 FROM characters WHERE stateId = ?', [stateId]));
}

export function CreateCharacter(
  userId: number,
  stateId: string,
  firstName: string,
  lastName: string,
  gender: string,
  date: number,
  phoneNumber?: number,
) {
  return db.insert(
    'INSERT INTO characters (userId, stateId, firstName, lastName, gender, dateOfBirth, phoneNumber) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, stateId, firstName, lastName, gender, new Date(Number(date)), phoneNumber],
  );
}

export function GetCharacters(userId: number) {
  return db.execute<Character>(
    'SELECT charId, stateId, firstName, lastName, gender, x, y, z, heading, DATE_FORMAT(lastPlayed, "%d/%m/%Y") AS lastPlayed FROM characters WHERE userId = ? AND deleted IS NULL LIMIT ?',
    [userId, CHARACTER_SLOTS],
  );
}

export function SaveCharacterData(values: any[] | any[][], batch?: boolean) {
  const query =
    'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, isDead = ?, lastPlayed = CURRENT_TIMESTAMP(), health = ?, armour = ?, statuses = ? WHERE charId = ?';

  return batch ? db.batch(query, values) : db.update(query, values);
}

export async function DeleteCharacter(charId: number) {
  return (await db.update('UPDATE characters SET deleted = curdate() WHERE charId = ?', [charId])) === 1;
}

export function GetCharacterMetadata(charId: number) {
  return db.row<{
    isDead: number;
    gender: string;
    dateOfBirth: string;
    phoneNumber: string;
    health: number;
    armour: number;
    statuses: Dict<number>;
  }>(
    'SELECT isDead, gender, DATE_FORMAT(dateOfBirth, "%d/%m/%Y") AS dateOfBirth, phoneNumber, health, armour, statuses FROM characters WHERE charId = ?',
    [charId],
  );
}

export function GetStatuses() {
  return db.query<OxStatus>('SELECT name, `default`, onTick FROM ox_statuses');
}

export function GetLicenses() {
  return db.query<Dict<OxLicense>>('SELECT name, label FROM ox_licenses');
}

export function GetLicense(name: string) {
  return db.row<OxLicense>('SELECT name, label FROM ox_licenses WHERE name = ?', [name]);
}

export function GetCharacterLicenses(charId: number) {
  return db.query<{ name: string; data: CharacterLicense }>(
    'SELECT name, data FROM character_licenses WHERE charId = ?',
    [charId],
  );
}

export function AddCharacterLicense(charId: number, name: string, data: CharacterLicense) {
  return db.update('INSERT INTO character_licenses (charId, name, data) VALUES (?, ?, ?)', [
    charId,
    name,
    JSON.stringify(data),
  ]);
}

export function RemoveCharacterLicense(charId: number, name: string) {
  return db.update('DELETE FROM character_licenses WHERE charId = ? AND name = ?', [charId, name]);
}

export function UpdateCharacterLicense(charId: number, name: string, key: string, value: any) {
  const params = [`$.${key}`, name, charId];

  if (value == null)
    return db.update('UPDATE character_licenses SET data = JSON_REMOVE(data, ?) WHERE name = ? AND charId = ?', params);

  params.splice(1, 0, value);

  return db.update('UPDATE character_licenses SET data = JSON_SET(data, ?, ?) WHERE name = ? AND charId = ?', params);
}

export function GetCharIdFromStateId(stateId: string) {
  return db.column<number>('SELECT charId FROM characters WHERE stateId = ?', [stateId]);
}

export async function UpdateUserTokens(userId: number, tokens: string[]) {
  const parameters = tokens.map((token) => [userId, token]);

  await db.batch('INSERT IGNORE INTO user_tokens (userId, token) VALUES (?, ?)', parameters);
}

export async function IsUserBanned(userId: number): Promise<BanDetails | undefined> {
  const banDetails = await db.query<BanDetails>(
    `SELECT bu.reason, bu.banned_at, bu.unban_at, bu.userId, ut.token
       FROM user_tokens ut
       JOIN banned_users bu ON ut.userId = bu.userId
       WHERE ut.userId = ?
       GROUP BY bu.userId`,
    [userId],
  );

  if (!banDetails?.[0]) return;

  const currentDate = new Date();
  const expiredBans = banDetails.filter((ban) => ban.unban_at && new Date(ban.unban_at) <= currentDate);

  if (expiredBans.length > 0) {
    await db.query(`DELETE FROM banned_users WHERE userId IN (?)`, [expiredBans.map((ban) => ban.userId)]);
    return;
  }

  return banDetails[0];
}

export async function BanUser(userId: number, reason?: string, hours?: number) {
  const success = await db.update(
    'INSERT INTO banned_users (userId, banned_at, unban_at, reason) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?)',
    [userId, hours, reason],
  );

  if (!success) {
    console.error(`Failed to ban ${userId}`);
    return false;
  }

  const playerId = OxPlayer.getFromUserId(userId)?.source as string;

  if (playerId) {
    const banned_at = Date.now();
    const unban_at = banned_at + (hours ? hours * 60 * 60 * 1000 : 0);

    DropPlayer(playerId, OxPlayer.formatBanReason({ userId, banned_at, unban_at, reason }));
  }

  return true;
}

export async function UnbanUser(userId: number) {
  const success = await db.update('DELETE FROM banned_users WHERE userId = ?', [userId]);

  return success;
}
