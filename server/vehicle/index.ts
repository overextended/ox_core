import './class';
import './commands';
import { OxVehicle } from './class';
import { CreateNewVehicle, GetStoredVehicleFromId, IsPlateAvailable } from './db';
import { GetVehicleData } from '../../common/vehicles';

export async function CreateVehicle(data: string | Dict<any>, coords?: number | number[], heading?: number) {
  const invokingScript = GetInvokingResource() || undefined;

  if (typeof data === 'string') data = { model: data };

  const vehicleData = GetVehicleData(data.model);
  let networkType: string = vehicleData.type;

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
