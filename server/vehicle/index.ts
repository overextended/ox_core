import { OxVehicle } from './class';
import { CreateNewVehicle, GetStoredVehicleFromId, IsPlateAvailable, VehicleRow } from './db';
import { GetVehicleData } from '../../common/vehicles';
import { DEBUG } from '../../common/config';
import './class';
import './commands';
import './events';
import { VehicleProperties } from '@overextended/ox_lib/server';
import { Vector3 } from '@nativewrappers/fivem';

if (DEBUG) import('./parser');

type Vec3 = number[] | { x: number; y: number; z: number } | { buffer: any };

export async function CreateVehicle(
  data:
    | string
    | (Partial<VehicleRow> & {
        model: string;
        owner?: number;
        group?: string;
        stored?: string;
        properties?: VehicleProperties;
      }),
  coords?: Vec3,
  heading?: number,
  invokingScript = GetInvokingResource()
) {
  if (typeof data === 'string') data = { model: data };

  const vehicleData = GetVehicleData(data.model as string);

  if (!vehicleData)
    throw new Error(
      `Failed to create vehicle '${data.model}' (model is invalid).\nEnsure vehicle exists in '@ox_core/common/data/vehicles.json'`
    );

  if (data.id) {
    const vehicle = OxVehicle.getFromVehicleId(data.id);

    if (vehicle) {
      if (DoesEntityExist(vehicle.entity)) {
        return vehicle;
      }

      vehicle.despawn(true);
    }
  }

  if (coords) coords = Vector3.fromObject(coords);

  const entity = coords ? OxVehicle.spawn(data.model, coords as Vector3, heading || 0) : 0;

  if (!entity || !DoesEntityExist(entity)) return;
  if (!data.vin && (data.owner || data.group)) data.vin = await OxVehicle.generateVin(vehicleData);
  if (data.vin && !data.owner && !data.group) delete data.vin;

  data.plate = (data.plate && data.id) ? data.plate : (data.plate && await IsPlateAvailable(data.plate)) ? data.plate : await OxVehicle.generatePlate();

  const metadata = data.data || ({} as { properties: VehicleProperties; [key: string]: any });
  metadata.properties = metadata.properties || data.properties;

  if (!data.id && data.vin) {
    data.id = await CreateNewVehicle(
      data.plate,
      data.vin,
      data.owner || null,
      data.group || null,
      data.model,
      vehicleData.class,
      metadata,
      data.stored || null
    );
  }

  if (!entity) return;

  const vehicle = new OxVehicle(
    entity,
    invokingScript,
    data.plate,
    data.model,
    vehicleData.make,
    data.stored || null,
    metadata,
    data.id,
    data.vin,
    data.owner,
    data.group
  );

  const state = vehicle.getState();

  state.set('initVehicle', true, true)

  return vehicle;
}

export async function SpawnVehicle(id: number, coords: Vec3, heading?: number) {
  const invokingScript = GetInvokingResource();
  const vehicle = await GetStoredVehicleFromId(id);

  if (!vehicle) return;

  vehicle.data = JSON.parse(vehicle.data as any);

  return await CreateVehicle(vehicle, coords, heading, invokingScript);
}

exports('CreateVehicle', CreateVehicle);
exports('SpawnVehicle', SpawnVehicle);
