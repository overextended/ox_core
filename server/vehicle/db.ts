import { db } from '../db';
import type { VehicleProperties } from '@communityox/ox_lib';
import { DEFAULT_VEHICLE_STORE } from 'config';

export type VehicleRow = {
  id: number;
  owner?: number;
  group?: string;
  plate: string;
  vin: string;
  model: string;
  data: { properties: Partial<VehicleProperties>; [key: string]: any };
};

if (DEFAULT_VEHICLE_STORE)
  setImmediate(() => db.query('UPDATE vehicles SET `stored` = ? WHERE `stored` IS NULL', [DEFAULT_VEHICLE_STORE]));

export async function IsPlateAvailable(plate: string) {
  return !(await db.exists('SELECT 1 FROM vehicles WHERE plate = ?', [plate]));
}

export async function IsVinAvailable(plate: string) {
  return !(await db.exists('SELECT 1 FROM vehicles WHERE vin = ?', [plate]));
}

export async function GetStoredVehicleFromId(id: number | string, column = 'id') {
  const row = await db.row<VehicleRow>(
    `SELECT id, owner, \`group\`, plate, vin, model, data FROM vehicles WHERE ${column} = ? AND \`stored\` IS NOT NULL`,
    [id],
  );

  if (row && typeof row.data === 'string') {
    console.warn(
      'vehicle.data was selected from the database as a string rather than JSON.\nLet us know if this warning occurred..',
    );
    row.data = JSON.parse(row.data);
  }

  return row;
}

export async function SetVehicleColumn(id: number | void, column: string, value: any) {
  if (!id) return;

  return (await db.update(`UPDATE vehicles SET \`${column}\` = ? WHERE id = ?`, [value, id])) === 1;
}

export function SaveVehicleData(
  values: any, // -.-
  batch?: boolean,
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
  stored: string | null,
) {
  return db.insert(
    'INSERT INTO vehicles (plate, vin, owner, `group`, model, class, data, `stored`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [plate, vin, owner, group, model, vehicleClass, JSON.stringify(data), stored],
  );
}

export async function DeleteVehicle(id: number) {
  return (await db.update('DELETE FROM vehicles WHERE id = ?', [id])) === 1;
}
