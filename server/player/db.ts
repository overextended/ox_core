import { Character, Dict, OxStatus } from 'types';
import { CHARACTER_SLOTS } from '../../common/config';
import { db } from '../db';

export function GetUserIdFromIdentifier(identifier: string, offset?: number) {
  return db.column<number>('SELECT userId FROM users WHERE license2 = ? LIMIT ?, 1', [identifier, offset || 0]);
}

export function CreateUser(username: string, identifiers: Dict<string>) {
  return db.insert('INSERT INTO users (username, license2, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)', [
    username,
    identifiers.license2,
    identifiers.steam,
    identifiers.fivem,
    identifiers.discord,
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
  phoneNumber?: number
) {
  return db.insert(
    'INSERT INTO characters (userId, stateId, firstName, lastName, gender, dateOfBirth, phoneNumber) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, stateId, firstName, lastName, gender, new Date(date), phoneNumber]
  );
}

export function GetCharacters(userId: number) {
  return db.execute<Character>(
    'SELECT charId, stateId, firstName, lastName, x, y, z, heading, DATE_FORMAT(lastPlayed, "%d/%m/%Y") AS lastPlayed FROM characters WHERE userId = ? AND deleted IS NULL LIMIT ?',
    [userId, CHARACTER_SLOTS]
  );
}

export function SaveCharacterData(values: any[] | any[][], batch?: boolean) {
  const query =
    'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, isDead = ?, lastPlayed = CURRENT_DATE(), health = ?, armour = ?, statuses = ? WHERE charId = ?';

  return batch ? db.batch(query, values) : db.update(query, values);
}

export async function DeleteCharacter(charId: number) {
  return (await db.update('UPDATE characters SET deleted = curdate() WHERE charId = ?', [charId])) === 1;
}

export function GetCharacterMetadata(charId: number) {
  return db.row<{
    isDead: boolean;
    gender: string;
    dateOfBirth: string;
    phoneNumber: string;
    health: number;
    armour: number;
    statuses: Dict<number>;
  }>(
    'SELECT isDead, gender, DATE_FORMAT(dateOfBirth, "%d/%m/%Y") AS dateOfBirth, phoneNumber, health, armour, statuses FROM characters WHERE charId = ?',
    [charId]
  );
}

export function GetStatuses() {
  return db.query<OxStatus>('SELECT name, `default`, onTick FROM ox_statuses');
}

export function GetLicenses() {
  return db.query<{ name?: string; label: string }>('SELECT name, label FROM ox_licenses');
}

export function GetCharacterLicenses(charId: number) {
  return db.query<{ name: string; issued: number }>('SELECT name, issued FROM character_licenses WHERE charid = ?', [
    charId,
  ]);
}

export function AddCharacterLicense(charId: number, name: string, issued: string) {
  return db.insert('INSERT INTO character_licenses (charId, name, issued) VALUES (?, ?, ?)', [charId, name, issued]);
}

export function RemoveCharacterLicense(charId: number, name: string) {
  return db.update('DELETE FROM character_licenses WHERE charId = ? AND name = ?', [charId, name]);
}

export function GetCharIdFromStateId(stateId: string) {
  return db.column<number>('SELECT charId FROM characters WHERE stateId = ?', [stateId]);
}
