import vehicles from './data/vehicles.json';
import vehicleStats from './data/vehicleStats.json';

export interface VehicleStats {
  acceleration: number;
  braking: number;
  handling: number;
  speed: number;
  traction: number;
}

export interface TopVehicleStats {
  air: VehicleStats;
  land: VehicleStats;
  sea: VehicleStats;
}

export type Vehicles = keyof typeof vehicles;
export type VehicleCategories = keyof TopVehicleStats;

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

export function GetTopVehicleStats(): Record<VehicleCategories, VehicleStats>;
export function GetTopVehicleStats(category: VehicleCategories): VehicleStats;

export function GetTopVehicleStats(category?: VehicleCategories) {
  return category ? (vehicleStats as any)[category] : vehicleStats;
}

export function GetVehicleData(): Record<Vehicles, VehicleData>;
export function GetVehicleData<T extends Vehicles>(filter: T | string): VehicleData;
export function GetVehicleData<T extends Vehicles[] | string[]>(
  filter: T
): {
  [K in T[number]]: VehicleData; // this could be better
};

export function GetVehicleData(filter?: void | Vehicles | Vehicles[]) {
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
