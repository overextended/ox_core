import './class';
import './commands';
import { OxVehicle } from './class';
import { GetStoredVehicleFromId } from './db';

export async function CreateVehicle(data: string | Dict<any>, coords?: number[], heading?: number) {
  const invokingScript = GetInvokingResource();

  if (typeof data === 'string') {
    data = { model: data };
  }

  const entity = CreateVehicleServerSetter(data.model, 'automobile', coords[0], coords[1], coords[2], heading || 90);

  if (!DoesEntityExist(entity)) return;

  const vehicle = new OxVehicle(
    entity,
    invokingScript,
    data.plate || OxVehicle.generatePlate(),
    data.model,
    data.make,
    data.id,
    data.vin || ((data.owner || data.owner) && OxVehicle.generateVin(data as any)) || undefined,
    data.owner,
    data.group,
    data.metadata
  );

  console.log(entity);
  console.log(vehicle);

  return vehicle;
}

export async function SpawnVehicle(id: number, coords: number[], heading?: number) {
  const vehicle = await GetStoredVehicleFromId(id);

  if (!vehicle) return;

  vehicle.data = JSON.parse(vehicle.data as any);

  return await CreateVehicle(vehicle, coords, heading);
}
