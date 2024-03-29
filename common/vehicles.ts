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
  filter: T
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

exports('GetTopVehicleStats', GetTopVehicleStats);
exports('GetVehicleData', GetVehicleData);
