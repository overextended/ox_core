import { db } from 'db';
import { OxGroup } from 'groups';

export function SelectGroups() {
  return db.query<OxGroup[]>('SELECT * FROM ox_groups');
}

export async function AddCharacterGroup(charId: number, name: string, grade: number) {
  return (
    (await db.update('INSERT INTO character_groups (charId, name, grade) VALUES (?, ?, ?)', [charId, name, grade])) ===
    1
  );
}

export async function UpdateCharacterGroup(charId: number, name: string, grade: number) {
  return (
    (await db.update('UPDATE character_groups SET grade = ? WHERE charId = ? AND name = ?', [grade, charId, name])) ===
    1
  );
}

export async function RemoveCharacterGroup(charId: number, name: string) {
  return (await db.update('DELETE FROM character_groups WHERE charId = ? AND name = ?', [charId, name])) === 1;
}

export function LoadCharacterGroups(charId: number) {
  return db.execute<{ name: string; grade: number }[]>('SELECT name, grade FROM character_groups WHERE charId = ?', [
    charId,
  ]);
}
