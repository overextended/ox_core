const exp = exports.ox_core.CVehicle;

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

interface ICVehicle {
  owner: number;
  id: number;
  netid: number;
  entity: number;
  model: string;
  script: string;
}

export class CVehicle implements ICVehicle {
  owner: number;
  id: number;
  netid: number;
  entity: number;
  model: string;
  script: string;

  constructor(data: ICVehicle) {
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
    exp(this.entity, "set", index, value);
  }

  get(index?: string): any {
    return exp(this.entity, "get", index);
  }

  despawn() {
    exp(this.entity, "despawn");
  }

  delete() {
    exp(this.entity, "delete");
  }

  setStored(value: string, despawn?: boolean) {
    exp(this.entity, "setStored", value, despawn);
  }

  setOwner(charid?: number) {
    return exp(this.entity, "setOwner", charid);
  }

  setGroup(groupName?: string) {
    return exp(this.entity, "setGroup", groupName);
  }

  setPlate(plate: string) {
    return exp(this.entity, "setPlate", plate);
  }
}

export function GetVehicle(vehicleId: number) {
  const vehicle = exports.ox_core.GetVehicle(vehicleId);
  return vehicle ? new CVehicle(vehicle) : null;
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
  const vehicle: ICVehicle = await exports.ox_core.CreateVehicle(data, coords, heading);
  return new CVehicle(vehicle);
}

export function GetVehicles(useclass?: boolean) {
  const vehicles: CVehicle[] = exports.ox_core.GetVehicles();

  if (useclass) {
    for (let i = 0; i === vehicles.length - 1; i++) {
      vehicles[i] = new CVehicle(vehicles[i]);
    }
  }

  return vehicles;
}
