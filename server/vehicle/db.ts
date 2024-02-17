import { db } from '../db';

setImmediate(() => db.query('UPDATE vehicles SET `stored` = ? WHERE `stored` IS NULL', ['impound']));

export async function IsPlateAvailable(plate: string) {
  return !(await db.exists('SELECT 1 FROM vehicles WHERE plate = ?', [plate]));
}

export async function IsVinAvailable(plate: string) {
  return !(await db.exists('SELECT 1 FROM vehicles WHERE vin = ?', [plate]));
}

export function GetStoredVehicleFromId(id: number) {
  return db.row<
    Partial<{ id: number; owner: number; group: string; plate: string; vin: string; model: string; data: string }>
  >('SELECT id, owner, `group`, plate, vin, model, data FROM vehicles WHERE id = ? AND `stored` IS NOT NULL', [id]);
}

export async function SetVehicleColumn(id: number | void, column: string, value: any) {
  if (!id) return;

  return (await db.update(`UPDATE vehicles SET \`${column}\` = ? WHERE id = ?`, [value, id])) === 1;
}

export function SaveVehicleData(
  values: any, // -.-
  batch?: boolean
) {
  const query = 'UPDATE vehicles SET `stored` = ?, data = ? WHERE id = ?';

  return batch ? db.batch(query, values) : db.update(query, values);
}

export function CreateNewVehicle(
  plate: string,
  vin: string,
  owner: number | null,
  group: string | null,
  model: string,
  vehicleClass: number,
  data: object,
  stored: string | null
) {
  return db.insert(
    'INSERT INTO vehicles (plate, vin, owner, `group`, model, class, data, `stored`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [plate, vin, owner, group, model, vehicleClass, JSON.stringify(data), stored]
  );
}

export async function DeleteVehicle(id: number) {
  return (await db.update('DELETE FROM vehicles WHERE id = ?', [id])) === 1;
}
