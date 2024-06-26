export type Dict<T> = { [key: string]: T };

export interface Character {
  charId: number;
  stateId: string;
  firstName: string;
  lastName: string;
  x?: number;
  y?: number;
  z?: number;
  heading?: number;
  lastPlayed?: string;
  health?: number;
  armour?: number;
  isNew?: boolean;
}

export interface NewCharacter {
  firstName: string;
  lastName: string;
  gender: string;
  date: number;
}

export interface PlayerMetadata {
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  activeGroup?: string;
}

export interface CharacterLicense {
  issued: number;
  suspended?: [number, number];
  [key: string]: any;
}

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

export interface OxStatus {
  name: string;
  default: number;
  onTick: number;
}

export interface OxAccount {
  id: number;
  balance: number;
  isDefault: boolean;
  label?: string;
  owner?: number;
  group?: string;
  type: 'personal' | 'shared' | 'group';
}

export interface OxAccountAccess extends OxAccount {
  canView: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
}

export interface DbGroup {
  name: string;
  label: string;
  grades: string[];
  type?: string;
  colour?: number;
}

export interface OxGroup extends DbGroup {
  grades: string[];
  principal: string;
}

export interface OxGroupPermissions {
  [grade: string]: { [permission: string]: boolean };
}
