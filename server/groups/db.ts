import { GetConnection, db } from 'db';
import type { DbGroup } from 'types';

export function SelectGroups() {
  return db.query<DbGroup>(`
    SELECT 
      ox_groups.*, 
      JSON_ARRAYAGG(ox_group_grades.label ORDER BY ox_group_grades.grade) AS grades
    FROM 
        ox_groups
    JOIN 
        ox_group_grades
    ON
        ox_groups.name = ox_group_grades.group
    GROUP BY 
        ox_groups.name;
  `);
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

export function GetCharacterGroups(charId: number) {
  return db.execute<{ name: string; grade: number; isActive: boolean }>(
    'SELECT name, grade, isActive FROM character_groups WHERE charId = ?',
    [charId]
  );
}

export async function SetActiveGroup(charId: number, groupName?: string) {
  using conn = await GetConnection();
  const params: [number, string?] = [charId];

  conn.execute(`UPDATE character_groups SET isActive = 0 WHERE charId = ? AND isActive = 1`, params);

  if (groupName) {
    params.push(groupName);
    conn.execute(`UPDATE character_groups SET isActive = 1 WHERE charId = ? AND name = ?`, params);
  }
}
