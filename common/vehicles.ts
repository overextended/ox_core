import { loadDataFile } from './';

export type Vehicles = Dict<VehicleData>;
export type VehicleCategories = 'air' | 'land' | 'sea';
export type TopVehicleStats = Record<VehicleCategories, VehicleStats>;

export interface VehicleStats {
  acceleration: number;
  braking: number;
  handling: number;
  speed: number;
  traction: number;
}

export enum VehicleClasses {
  COMPACT,
  SEDAN,
  SUV,
  COUPE,
  MUSCLE,
  SPORTS_CLASSIC,
  SPORTS,
  SUPER,
  MOTORCYCLE,
  OFFROAD,
  INDUSTRIAL,
  UTILITY,
  VANS,
  CYCLES,
  BOATS,
  HELICOPTERS,
  PLANES,
  SERVICE,
  EMERGENCY,
  MILITARY,
  COMMERCIAL,
  TRAINS,
  OPEN_WHEEL,
}

export type VehicleTypes =
  | 'amphibious_automobile'
  | 'amphibious_quadbike'
  | 'automobile'
  | 'bicycle'
  | 'bike'
  | 'blimp'
  | 'boat'
  | 'heli'
  | 'plane'
  | 'quadbike'
  | 'submarine'
  | 'submarinecar'
  | 'trailer'
  | 'train';

export interface VehicleData extends VehicleStats {
  class: VehicleClasses;
  doors: number;
  make: string;
  name: string;
  price: number;
  seats: number;
  type: VehicleTypes;
  weapons?: true;
}

const vehicles: Dict<VehicleData> = loadDataFile('vehicles');
const vehicleStats = loadDataFile('vehicleStats');

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
