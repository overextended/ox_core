import { OxVehicle } from 'server/vehicle/class';

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
}

Object.keys(exports.ox_core.GetVehicleCalls()).forEach((method: string) => {
  (VehicleInterface.prototype as any)[method] = function (...args: any[]) {
    return exports.ox_core.CallVehicle(this.source, method, ...args);
  };
});

VehicleInterface.prototype.toString = function () {
  return JSON.stringify(this, null, 2);
};

export function GetVehicle(entityId: number): OxVehicle | void {
  const vehicle = exports.ox_core.GetVehicle(entityId);

  if (!vehicle) return console.error(`cannot create VehicleInterface<${entityId}> (invalid id)`);

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

export function GetVehicleFromNetId(netId: number) {
  return GetVehicle(NetworkGetEntityFromNetworkId(netId));
}

// setTimeout(async () => {
//   const entity = await exports.ox_core.SpawnVehicle(11, GetEntityCoords(GetPlayerPed(1), true));
//   const vehicle = GetVehicle(entity);

//   console.log(vehicle);
// }, 5000);
