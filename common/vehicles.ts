import { LoadDataFile } from './';
import type { Dict, VehicleCategories, VehicleData, VehicleStats, Vehicles } from 'types';

const vehicles: Dict<VehicleData> = LoadDataFile('vehicles');
const vehicleStats = LoadDataFile('vehicleStats');

export function GetTopVehicleStats(): Record<VehicleCategories, VehicleStats>;
export function GetTopVehicleStats(category: VehicleCategories): VehicleStats;

export function GetTopVehicleStats(category?: VehicleCategories) {
  return category ? (vehicleStats as any)[category] : vehicleStats;
}

export function GetVehicleData(): Vehicles;
export function GetVehicleData<T extends string>(filter: T): VehicleData;
export function GetVehicleData<T extends string[]>(
  filter: T,
): {
  [K in T[number]]: VehicleData; // this could be better
};

export function GetVehicleData(filter?: void | string | string[]) {
  if (!filter) return vehicles;

  if (typeof filter === 'string') return vehicles[filter];

  if (Array.isArray(filter)) {
    const obj: Record<string, any> = {};

    filter.forEach((name) => {
      const vehicle = vehicles[name];

      if (vehicle) obj[name] = vehicle;
    });

    return obj;
  }
}

/**
 * Remap vehicle types to their net types.
 * https://github.com/citizenfx/fivem/commit/1e266a2ca5c04eb96c090de67508a3475d35d6da
 */
export function GetVehicleNetworkType(modelName: string) {
  const vehicleType = vehicles[modelName]?.type;

  switch (vehicleType) {
    case 'bicycle':
      return 'bike';
    case 'blimp':
      return 'heli';
    case 'quadbike':
    case 'amphibious_quadbike':
    case 'amphibious_automobile':
    case 'submarinecar':
      return 'automobile';
    default:
      return vehicleType;
  }
}

exports('GetTopVehicleStats', GetTopVehicleStats);
exports('GetVehicleData', GetVehicleData);
exports('GetVehicleNetworkType', GetVehicleNetworkType);
