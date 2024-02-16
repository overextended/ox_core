import { OxVehicle } from './class';
import { CreateNewVehicle, GetStoredVehicleFromId, IsPlateAvailable } from './db';
import { GetVehicleData } from '../../common/vehicles';
import { DEBUG } from '../../common/config';

import './class';
import './commands';
import { Dict } from 'types';

if (DEBUG) import('./parser');

export async function CreateVehicle(data: string | Dict<any>, coords?: number | number[], heading?: number) {
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
        return vehicle.entity;
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

  const invokingScript = GetInvokingResource();
  const entity = CreateVehicleServerSetter(data.model, networkType, coords[0], coords[1], coords[2], heading || 90);

  if (!DoesEntityExist(entity)) return;
  if (!data.vin && (data.owner || data.owner)) data.vin = await OxVehicle.generateVin(data as any);
  if (data.vin && !data.owner && !data.owner) delete data.vin;

  data.plate = data.plate && (await IsPlateAvailable(data.plate)) ? data.plate : await OxVehicle.generatePlate();

  if (!data.id && data.vin) {
    data.id = await CreateNewVehicle(
      data.plate,
      data.vin,
      data.owner,
      data.group,
      data.model,
      vehicleData.class,
      data.data || {},
      data.stored
    );
  }

  const vehicle = new OxVehicle(
    entity,
    invokingScript,
    data.plate,
    data.model,
    vehicleData.make,
    data.id,
    data.vin,
    data.owner,
    data.group,
    data.data
  );

  if (vehicle.id) vehicle.setStored(null, false);

  return vehicle.entity;
}

export async function SpawnVehicle(id: number, coords: number | number[], heading?: number) {
  const vehicle = await GetStoredVehicleFromId(id);

  if (!vehicle) return;

  vehicle.data = JSON.parse(vehicle.data as any);

  return await CreateVehicle(vehicle, coords, heading);
}

exports('CreateVehicle', CreateVehicle);
exports('SpawnVehicle', SpawnVehicle);
