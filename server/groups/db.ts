import { GetConnection, db } from 'db';
import type { UpsertResult } from 'mariadb';
import type { DbGroup } from 'types';

export function SelectGroups() {
  return db.query<DbGroup>(`
    SELECT 
      ox_groups.*,
      JSON_OBJECTAGG(ox_group_grades.grade, ox_group_grades.accountRole) AS accountRoles,
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

export async function InsertGroup({ name, label, type, colour, hasAccount, grades, accountRoles }: DbGroup) {
  using conn = await GetConnection();
  await conn.beginTransaction();

  const insertedGroup = await conn.update(
    'INSERT IGNORE INTO `ox_groups` (`name`, `label`, `type`, `colour`, `hasAccount`) VALUES (?, ?, ?, ?, ?)',
    [name, label, type, colour, hasAccount],
  );

  if (!insertedGroup) return true;

  const insertedGrades = (await conn.batch(
    'INSERT INTO `ox_group_grades` (`group`, `grade`, `label`, `accountRole`) VALUES (?, ?, ?, ?)',
    grades.map((gradeLabel, index) => [name, index + 1, gradeLabel, accountRoles[index + 1]]),
  )) as UpsertResult[];

  return insertedGrades.reduce((acc, curr) => acc + curr.affectedRows, 0) > 0
}

export function RemoveGroup(groupName: string) {
  return db.update('DELETE FROM `ox_groups` WHERE name = ?', [groupName]);
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
    [charId],
  );
}

export async function SetActiveGroup(charId: number, groupName?: string) {
  using conn = await GetConnection();
  const params: [number, string?] = [charId];

  conn.execute('UPDATE character_groups SET isActive = 0 WHERE charId = ? AND isActive = 1', params);

  if (groupName) {
    params.push(groupName);
    conn.execute('UPDATE character_groups SET isActive = 1 WHERE charId = ? AND name = ?', params);
  }
}
