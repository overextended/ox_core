import type { OxVehicle as _OxVehicle } from 'server/vehicle/class';
import type { CreateVehicleData } from 'server/vehicle';

class VehicleInterface {
  constructor(
    public entity: number,
    public netId: number,
    public script: string,
    public plate: string,
    public model: string,
    public make: string,
    public id?: number,
    public vin?: string,
    public owner?: number,
    public group?: string
  ) {
    this.entity = entity;
    this.netId = netId;
    this.script = script;
    this.plate = plate;
    this.model = model;
    this.make = make;
    this.id = id;
    this.vin = vin;
    this.owner = owner;
    this.group = group;
  }

  getCoords() {
    return GetEntityCoords(this.entity);
  }

  getState() {
    return Entity(this.entity).state;
  }
}

Object.keys(exports.ox_core.GetVehicleCalls()).forEach((method: string) => {
  (VehicleInterface.prototype as any)[method] = function (...args: any[]) {
    return exports.ox_core.CallVehicle(this.entity, method, ...args);
  };
});

VehicleInterface.prototype.toString = function () {
  return JSON.stringify(this, null, 2);
};

export type OxVehicle = _OxVehicle & VehicleInterface;

function CreateVehicleInstance(vehicle?: _OxVehicle) {
  if (!vehicle) return;

  return new VehicleInterface(
    vehicle.entity,
    vehicle.netId,
    vehicle.script,
    vehicle.plate,
    vehicle.model,
    vehicle.make,
    vehicle.id,
    vehicle.vin,
    vehicle.owner,
    vehicle.group
  ) as OxVehicle;
}

export function GetVehicle(entityId: number) {
  return CreateVehicleInstance(exports.ox_core.GetVehicle(entityId));
}

export function GetVehicleFromNetId(netId: number) {
  return CreateVehicleInstance(exports.ox_core.GetVehicleFromNetId(netId));
}

export function GetVehicleFromVin(vin: string) {
  return CreateVehicleInstance(exports.ox_core.GetVehicleFromVin(vin));
}

export async function CreateVehicle(
  data: CreateVehicleData,
  coords?: number | number[] | { x: number; y: number; z: number },
  heading?: number
) {
  return CreateVehicleInstance(await exports.ox_core.CreateVehicle(data, coords, heading));
}

export async function SpawnVehicle(
  dbId: number,
  coords: number | number[] | { x: number; y: number; z: number },
  heading?: number
) {
  return CreateVehicleInstance(await exports.ox_core.SpawnVehicle(dbId, coords, heading));
}
