import { OxVehicle, Vec3 } from './class';
import { CreateNewVehicle, GetStoredVehicleFromId, IsPlateAvailable, type VehicleRow } from './db';
import { GetVehicleData } from '../../common/vehicles';
import { DEBUG } from '../../common/config';
import './class';
import './commands';
import './events';
import type { VehicleProperties } from '@communityox/ox_lib/server';

if (DEBUG) import('./parser');

export interface CreateVehicleData {
  model: string;
  owner?: number;
  group?: string;
  stored?: string;
  properties?: Partial<VehicleProperties>;
}

export async function CreateVehicle(
  data: string | (CreateVehicleData & Partial<VehicleRow>),
  coords?: Vec3,
  heading?: number,
  invokingScript = GetInvokingResource(),
) {
  if (typeof data === 'string') data = { model: data };

  const vehicleData = GetVehicleData(data.model as string);

  if (!vehicleData)
    throw new Error(
      `Failed to create vehicle '${data.model}' (model is invalid).\nEnsure vehicle exists in '@ox_core/common/data/vehicles.json'`,
    );

  if (data.id) {
    const vehicle = OxVehicle.getFromVehicleId(data.id);

    if (vehicle) {
      if (vehicle.entity && DoesEntityExist(vehicle.entity)) {
        return vehicle;
      }

      vehicle.despawn(true);
    }
  }

  const isOwned = !!(data.owner || data.group);

  if (!data.vin) data.vin = await OxVehicle.generateVin(vehicleData, isOwned);

  data.plate =
    data.vin && data.plate
      ? data.plate
      : data.plate && (await IsPlateAvailable(data.plate))
        ? data.plate
        : await OxVehicle.generatePlate();

  const metadata = data.data || ({} as { properties?: Partial<VehicleProperties>; [key: string]: any });
  metadata.properties = data.properties || data.data?.properties || ({} as Partial<VehicleProperties>);

  if (!data.id && data.vin && isOwned) {
    data.id = await CreateNewVehicle(
      data.plate,
      data.vin,
      data.owner || null,
      data.group || null,
      data.model,
      vehicleData.class,
      metadata,
      data.stored || null,
    );
  }

  const properties = data.properties || metadata.properties || ({} as Partial<VehicleProperties>);
  delete metadata.properties;

  const vehicle = new OxVehicle(
    data.vin,
    invokingScript,
    data.plate,
    data.model,
    vehicleData.make,
    data.stored || null,
    metadata,
    properties,
    data.id,
    data.owner,
    data.group,
  );

  if (coords) {
    vehicle.respawn(coords, heading || 0);
  }

  if (vehicle.entity) vehicle.setStored(null, false);

  return vehicle;
}

export async function SpawnVehicle(id: number | string, coords?: Vec3, heading?: number) {
  const invokingScript = GetInvokingResource();
  const vehicle = await GetStoredVehicleFromId(id, typeof id === 'string' ? 'vin' : 'id');

  if (!vehicle) return;

  return await CreateVehicle(vehicle, coords, heading, invokingScript);
}

exports('CreateVehicle', CreateVehicle);
exports('SpawnVehicle', SpawnVehicle);
