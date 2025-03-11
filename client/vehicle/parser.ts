import { cache, notify, onServerCallback, requestModel, sleep } from '@overextended/ox_lib/client';
import { GetTopVehicleStats, GetVehicleData } from '../../common/vehicles';
import type { VehicleData, VehicleTypes, VehicleCategories } from 'types';

const PRICE_WEIGHTS: Record<VehicleTypes, number> = {
  automobile: 1600,
  bicycle: 150,
  bike: 500,
  boat: 6000,
  heli: 90000,
  plane: 16000,
  quadbike: 1100,
  train: 6000,
  submarinecar: 26000,
  submarine: 22000,
  blimp: 14000,
  trailer: 10000,
  amphibious_automobile: 6400,
  amphibious_quadbike: 4600
};

const BATCH_SIZE = 10;
const vehicles = GetVehicleData();

function GetVehicleModels(parseAll: boolean): string[] {
  return GetAllVehicleModels()
    .filter((vehicle: string) => parseAll || !vehicles[vehicle])
    .sort();
}

async function IsModelValid(hash: number): Promise<boolean> {
  try {
    await requestModel(hash, 10000);
    return true;
  } catch {
    return false;
  }
}

function SpawnVehicle(hash: number, coords: [number, number, number]): number {
  const entity = CreateVehicle(hash, ...coords, 0, false, false);
  SetPedIntoVehicle(cache.ped, entity, -1);
  return entity;
}

function GetVehicleTypeEx(entity: number): VehicleTypes {
  switch (GetVehicleTypeRaw(entity)) {
    case 0:
    default:
      return 'automobile';
    case 1:
      return 'plane';
    case 2:
      return 'trailer';
    case 3:
      return 'quadbike';
    case 5:
      return 'submarinecar';
    case 6:
      return 'amphibious_automobile';
    case 7:
      return 'amphibious_quadbike';
    case 8:
      return 'heli';
    case 9:
      return 'blimp';
    case 11:
      return 'bike';
    case 12:
      return 'bicycle';
    case 13:
      return 'boat';
    case 14:
      return 'train';
    case 15:
      return 'submarine';
  }
}

function ParseVehicleData(entity: number, hash: number, model: string): VehicleData {
  let make = GetMakeNameFromVehicleModel(hash);
  if (!make) make = GetMakeNameFromVehicleModel(model.replace(/\W/g, '')) || '';

  const vehicleType = GetVehicleTypeEx(entity);
  const vehicleCategory: VehicleCategories =
    vehicleType === 'heli' || vehicleType === 'plane' || vehicleType === 'blimp'
      ? 'air'
      : vehicleType === 'boat' || vehicleType === 'submarine'
        ? 'sea'
        : 'land';

  const data: VehicleData = {
    acceleration: +GetVehicleModelAcceleration(hash).toFixed(4),
    braking: +GetVehicleModelMaxBraking(hash).toFixed(4),
    handling: +GetVehicleModelEstimatedAgility(hash).toFixed(4),
    speed: +GetVehicleModelEstimatedMaxSpeed(hash).toFixed(4),
    traction: +GetVehicleModelMaxTraction(hash).toFixed(4),
    name: GetLabelText(GetDisplayNameFromVehicleModel(hash)),
    make: make ? GetLabelText(make) : '',
    class: GetVehicleClass(entity),
    seats: GetVehicleModelNumberOfSeats(hash),
    doors: GetNumberOfVehicleDoors(entity),
    type: vehicleType,
    price: 0,
    category: vehicleCategory,
  };

  if (DoesVehicleHaveWeapons(entity)) data.weapons = true;

  CalculateVehiclePrice(data, entity);

  console.log(`^5Parsed valid model ${model} (${data.make || '?'} ${data.name})^0`);

  return data;
}

function CalculateVehiclePrice(data: VehicleData, entity: number) {
  let price = data.braking + data.acceleration + data.handling + data.speed;

  if (GetVehicleHasKers(entity)) price *= 2;
  if (GetHasRocketBoost(entity)) price *= 3;
  if (GetCanVehicleJump(entity)) price *= 1.5;
  if (GetVehicleHasParachute(entity)) price *= 1.5;
  if (data.weapons) price *= 5;

  data.price = Math.floor(price * (PRICE_WEIGHTS[data.type] ?? 1));
}

function CleanupVehicle(entity: number, coords: [number, number, number]) {
  SetVehicleAsNoLongerNeeded(entity);
  SetModelAsNoLongerNeeded(GetEntityModel(entity));
  DeleteEntity(entity);
  SetEntityCoordsNoOffset(cache.ped, ...coords, false, false, false);
}

/**
 * An event only registered when DEBUG is enabled.
 * Allows external scripts to freely modify vehicle data.
 */
on('ox:setVehicleData', (model: string, data: Record<string, any>) => {
  if (!vehicles[model]) console.error(`Cannot set vehicle data for ${model} (invalid model)`);

  Object.assign(vehicles[model], data);
});

onServerCallback('ox:generateVehicleData', async (parseAll: boolean) => {
  const coords = GetEntityCoords(cache.ped, true) as [number, number, number];
  const invalidVehicles: string[] = [];
  const vehicleModels = GetVehicleModels(parseAll);

  SetPlayerControl(cache.playerId, false, 1 << 8);
  FreezeEntityPosition(cache.ped, true);

  notify({ title: 'Generating vehicle data', description: `${vehicleModels.length} models loaded.`, type: 'inform' });

  let parsed = 0;

  for (let i = 0; i < vehicleModels.length; i += BATCH_SIZE) {
    await Promise.all(
      vehicleModels.slice(i, i + BATCH_SIZE).map(async (model) => {
        model = model.toLowerCase();
        const hash = GetHashKey(model);
        const isValid = await IsModelValid(hash);

        if (!isValid) return invalidVehicles.push(model);

        try {
          const entity = SpawnVehicle(hash, coords);
          vehicles[model] = ParseVehicleData(entity, hash, model);
          emit(`ox:parsedVehicle`, model, entity);
          ++parsed;

          CleanupVehicle(entity, coords);
        } catch {
          invalidVehicles.push(model);
        }
      }),
    );
  }

  SetPlayerControl(cache.playerId, true, 0);
  FreezeEntityPosition(cache.ped, false);

  notify({
    title: 'Generated vehicle data',
    description: `Generated data for ${parsed}/${vehicleModels.length} models.`,
    type: 'success',
  });

  console.log(`^5Generated data for ${parsed}/${vehicleModels.length} models.^0`);

  if (invalidVehicles.length)
    console.log(
      `^3Failed to parse data for ${invalidVehicles.length} invalid vehicles.\n${JSON.stringify(invalidVehicles, null, 2)}^0`,
    );

  await sleep(5000);

  return [vehicles, GetTopVehicleStats(), invalidVehicles];
});
