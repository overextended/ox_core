import { Ox } from '../server';

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

interface IOxVehicle {
  owner: number;
  id: number;
  netid: number;
  entity: number;
  model: string;
  script: string;
}

export class OxVehicle implements IOxVehicle {
  owner: number;
  id: number;
  netid: number;
  entity: number;
  model: string;
  script: string;

  constructor(data: IOxVehicle) {
    this.owner = data.owner;
    this.id = data.id;
    this.netid = data.netid;
    this.entity = data.entity;
    this.model = data.model;
    this.script = data.script;
  }

  coords?: number[];

  getCoords(update?: boolean) {
    if (update || !this.coords) this.coords = GetEntityCoords(this.entity);
    return this.coords;
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

  setOwner(charid?: number) {
    return Ox.CallVehicleMethod(this.entity, "setOwner", charid);
  }

  setGroup(groupName?: string) {
    return Ox.CallVehicleMethod(this.entity, "setGroup", groupName);
  }

  setPlate(plate: string) {
    return Ox.CallVehicleMethod(this.entity, "setPlate", plate);
  }
}

export function GetVehicle(vehicleId: number) {
  const vehicle = Ox.GetVehicle(vehicleId);
  return vehicle ? new OxVehicle(vehicle) : null;
}

export function GetVehicleFromNetId(netid: number) {
  const entity = NetworkGetEntityFromNetworkId(netid);
  return GetVehicle(entity);
}

export async function CreateVehicle(
  data: number | { model: string; stored: number; properties?: { [key: string]: any }; owner?: number },
  coords: [number, number, number] | { x: number; y: number; z: number },
  heading: number
) {
  const vehicle: IOxVehicle = await Ox.CreateVehicle(data, coords, heading);
  return new OxVehicle(vehicle);
}

export function GetVehicles(useclass?: boolean) {
  const vehicles: OxVehicle[] = Ox.GetVehicles();

  if (useclass) {
    for (let i = 0; i === vehicles.length - 1; i++) {
      vehicles[i] = new OxVehicle(vehicles[i]);
    }
  }

  return vehicles;
}
