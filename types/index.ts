export type Dict<T> = { [key: string]: T };

export interface Character {
  charId: number;
  stateId: string;
  firstName: string;
  lastName: string;
  gender: string;
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
  category: VehicleCategories;
  weapons?: true;
  [key: string]: unknown;
}

export interface OxLicense {
  name?: string;
  label?: string;
}

export interface OxStatus {
  name: string;
  default: number;
  onTick: number;
}

export interface OxAccountMetadata {
  id: number;
  balance: number;
  isDefault: boolean;
  label: string;
  type: 'personal' | 'shared' | 'group';
  owner?: number;
  group?: string;
}

export interface OxAccountUserMetadata extends OxAccountMetadata {
  role: OxAccountRole;
  ownerName: string;
}

export interface DbGroup {
  name: string;
  label: string;
  grades: string[];
  accountRoles: Dict<OxAccountRole>;
  type?: string;
  colour?: number;
  hasAccount: boolean;
  activePlayers: Set<number>;
}

export interface OxGroup extends DbGroup {
  grades: string[];
  principal: string;
}

export interface CreateGroupProperties {
  name: string;
  label: string;
  grades: {
    label: string;
    accountRole?: OxAccountRole;
  }[];
  type?: string;
  colour?: number;
  hasAccount?: boolean;
}

export interface OxGroupPermissions {
  [grade: string]: { [permission: string]: boolean };
}

export type OxAccountRole = 'viewer' | 'contributor' | 'manager' | 'owner';

export interface OxAccountPermissions {
  deposit: boolean;
  withdraw: boolean;
  addUser: boolean;
  removeUser: boolean;
  manageUser: boolean;
  transferOwnership: boolean;
  viewHistory: boolean;
  manageAccount: boolean;
  closeAccount: boolean;
  sendInvoice: boolean;
  payInvoice: boolean;
}

export interface OxAccountInvoice {
  id: number;
  actorId?: number;
  payerId?: number;
  fromAccount: number;
  toAccount: number;
  amount: number;
  message?: string;
  sentAt: number;
  dueDate: number;
  paidAt?: number;
}

export interface OxCreateInvoice {
  /** The charId of the player creating the invoice. */
  actorId?: number;
  /** The accountId of the account issuing the invoice. */
  fromAccount: number;
  /** The accountId of the account receiving the invoice. */
  toAccount: number;
  amount: number;
  message: string;
  dueDate: string;
}

export interface BanDetails {
  userId: number;
  token?: string;
  reason?: string;
  banned_at: number;
  unban_at?: number;
}
