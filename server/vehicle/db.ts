import { OkPacket, db } from '../db';

setImmediate(async () => {
  using conn = await db.getConnection();
  conn.query('UPDATE vehicles SET `stored` = ? WHERE `stored` IS NULL', ['impound']);
});

export async function IsPlateAvailable(plate: string) {
  using conn = await db.getConnection();
  return db.scalar(await conn.execute<{ '1': 1 }[]>('SELECT 1 FROM vehicles WHERE plate = ?', [plate])) !== 1;
}

export async function IsVinAvailable(plate: string) {
  using conn = await db.getConnection();
  return db.scalar(await conn.execute<{ '1': 1 }[]>('SELECT 1 FROM vehicles WHERE vin = ?', [plate])) !== 1;
}

export async function GetStoredVehicleFromId(id: number) {
  using conn = await db.getConnection();
  return db.single(
    await conn.execute<{ owner: number | null; group: string | null; vin: string; model: string; data: string }[]>(
      'SELECT owner, `group`, plate, vin, model, data FROM vehicles WHERE id = ? AND `stored` IS NOT NULL'
    )
  );
}

export async function SetVehicleColumn(id: number, column: string, value: any) {
  using conn = await db.getConnection();
  return (await conn.execute(`UPDATE vehicles SET \`${column}\` = ? WHERE id = ?`, [value, id])).affectedRows === 1;
}

export async function SaveVehicleData(
  values: [string | null, string, number] | [string | null, string, number][],
  batch?: boolean
) {
  using conn = await db.getConnection();
  const query = 'UPDATE vehicles SET `stored` = ?, data = ? WHERE id = ?';

  if (batch) await conn.batch(query, values);
  else await conn.execute(query, values);
}

export async function CreateVehicle(
  plate: string,
  owner: number | null,
  group: string | null,
  model: string,
  vClass: string,
  data: object,
  stored: string | null
) {
  using conn = await db.getConnection();
  return (
    await conn.execute<OkPacket>(
      'INSERT INTO vehicles (plate, vin, owner, `group`, model, class, data, `stored`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [plate, owner, group, model, vClass, JSON.stringify(data), stored]
    )
  ).insertId;
}

export async function DeleteVehicle(id: number) {
  using conn = await db.getConnection();
  return (await conn.execute<OkPacket>('DELETE FROM vehicles WHERE id = ?', [id])).affectedRows === 1;
}
