import { OxVehicle } from './class';
import { CreateNewVehicle, GetStoredVehicleFromId, IsPlateAvailable, VehicleRow } from './db';
import { GetVehicleData } from '../../common/vehicles';
import { DEBUG } from '../../common/config';

import './class';
import './commands';
import './events';
import { VehicleProperties } from '@overextended/ox_lib';
import { VectorFromBuffer } from '../../common';

if (DEBUG) import('./parser');

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
  coords?: number | number[] | { x: number; y: number; z: number } | { buffer: any },
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

  let networkType: string = vehicleData.type as any;

  /**
   * Remap vehicle types to their net types.
   * https://github.com/citizenfx/fivem/commit/1e266a2ca5c04eb96c090de67508a3475d35d6da
   */

  switch (networkType) {
    case 'bicycle':
      networkType = 'bike';
      break;
    case 'blimp':
      networkType = 'heli';
      break;
    case 'quadbike':
    case 'amphibious_quadbike':
    case 'amphibious_automobile':
    case 'submarinecar':
      networkType = 'automobile';
      break;
  }

  if (typeof coords === 'number') coords = GetEntityCoords(coords);
  else if (typeof coords === 'object' && !Array.isArray(coords)) {
    coords = 'buffer' in coords ? VectorFromBuffer(coords) : [coords.x || 0, coords.y || 0, coords.z || 0];
  }

  const entity = coords
    ? CreateVehicleServerSetter(data.model, networkType, coords[0], coords[1], coords[2], heading || 90)
    : 0;

  if (!coords || !DoesEntityExist(entity)) return;
  if (!data.vin && (data.owner || data.group)) data.vin = await OxVehicle.generateVin(vehicleData);
  if (data.vin && !data.owner && !data.group) delete data.vin;

  data.plate =
    data.plate && (!data.id || (await IsPlateAvailable(data.plate))) ? data.plate : await OxVehicle.generatePlate();

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

  if (vehicle.id) vehicle.setStored(null, false);

  const state = vehicle.getState();

  state.set('initVehicle', true, true);
  state.set('vehicleProperties', metadata.properties, true);

  return vehicle;
}

export async function SpawnVehicle(id: number, coords: number | number[], heading?: number) {
  const invokingScript = GetInvokingResource();
  const vehicle = await GetStoredVehicleFromId(id);

  if (!vehicle) return;

  vehicle.data = JSON.parse(vehicle.data as any);

  return await CreateVehicle(vehicle, coords, heading, invokingScript);
}

exports('CreateVehicle', CreateVehicle);
exports('SpawnVehicle', SpawnVehicle);
