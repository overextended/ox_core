import { Ox } from "../server";

export interface VehicleStats {
  acceleration: number;
  braking: number;
  handling: number;
  speed: number;
}

export interface TopVehicleStats {
  air: VehicleStats;
  land: VehicleStats;
  sea: VehicleStats;
}

export interface VehicleData extends VehicleStats {
  class: number;
  doors: number;
  make: string;
  name: string;
  price: number;
  seats: number;
  type: string;
}

export interface IOxVehicle {
  id: number;
  owner?: number;
  group?: string;
  netid: number;
  entity: number;
  model: string;
  plate: string;
  vin?: string;
  script: string;
  stored?: string;
}

export class OxVehicle implements IOxVehicle {
  id: number;
  owner?: number;
  group?: string;
  netid: number;
  entity: number;
  model: string;
  plate: string;
  vin?: string;
  script: string;
  stored?: string;

  constructor(data: IOxVehicle) {
    this.id = data.id;
    this.owner = data.owner;
    this.group = data.group;
    this.netid = data.netid;
    this.entity = data.entity;
    this.model = data.model;
    this.plate = data.plate;
    this.vin = data.vin;
    this.script = data.script;
    this.stored = data.stored;
  }

  getState() {
    return Entity(this.entity).state;
  }

  getCoords() {
    return GetEntityCoords(this.entity);
  }

  set(index: string, value: any) {
    Ox.CallVehicleMethod(this.entity, "set", index, value);
  }

  get(index?: string): any {
    return Ox.CallVehicleMethod(this.entity, "get", index);
  }

  despawn() {
    Ox.CallVehicleMethod(this.entity, "despawn");
  }

  delete() {
    Ox.CallVehicleMethod(this.entity, "delete");
  }

  setStored(value: string, despawn?: boolean) {
    Ox.CallVehicleMethod(this.entity, "setStored", value, despawn);
  }

  setOwner(charId?: number) {
    return Ox.CallVehicleMethod(this.entity, "setOwner", charId);
  }

  setGroup(groupName?: string) {
    return Ox.CallVehicleMethod(this.entity, "setGroup", groupName);
  }

  setPlate(plate: string) {
    return Ox.CallVehicleMethod(this.entity, "setPlate", plate);
  }
}

export function GetVehicle(entityId: number) {
  const vehicle = Ox.GetVehicle(entityId);
  return vehicle ? new OxVehicle(vehicle) : null;
}

export function GetVehicleFromNetId(netId: number) {
  const entity = NetworkGetEntityFromNetworkId(netId);
  return GetVehicle(entity);
}

export function GetVehicleFromVehicleId(vehicleId: number) {
  const vehicle = Ox.GetVehicleFromVehicleId(vehicleId);
  return vehicle ? new OxVehicle(vehicle) : null;
}

export async function CreateVehicle(
  data: number | { model: string; stored: number; properties?: { [key: string]: any }; owner?: number },
  coords: [number, number, number] | { x: number; y: number; z: number },
  heading: number
) {
  const vehicle: IOxVehicle = await Ox.CreateVehicle(data, coords, heading);
  return new OxVehicle(vehicle);
}

export function GetVehicles() {
  const vehicles: OxVehicle[] = Ox.GetVehicles();

  for (let i = 0; i === vehicles.length - 1; i++) {
    vehicles[i] = new OxVehicle(vehicles[i]);
  }

  return vehicles;
}
