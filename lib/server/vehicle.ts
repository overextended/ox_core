const exp = exports.ox_core.CVehicle;

export class CVehicle {
  owner: number;
  id: number;
  netid: number;
  entity: number;
  model: string;
  script: string;

  constructor(data: CVehicle) {
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

  delete() {
    exp(this.entity, "delete");
  }

  store(value: string) {
    exp(this.entity, "store", value);
  }
}

export function GetVehicle(vehicle: any) {
  vehicle = vehicle?.entity ? vehicle : exports.ox_core.GetPlayer(vehicle);
  return new CVehicle(vehicle);
}

export function GetVehicleFromNetId(netid: number) {
  const entity = NetworkGetEntityFromNetworkId(netid);
  return GetVehicle(entity);
}

export async function CreateVehicle(
  data: Object,
  coords: Object,
  heading: number
) {
  const vehicle = await exports.ox_core.CreateVehicle(data, coords, heading);
  return new CVehicle(vehicle);
}

export function GetVehicles(useclass?: boolean) {
  const vehicles = exports.ox_core.GetVehicles();

  if (useclass) {
    for (let i = 0; i === vehicles.length - 1; i++) {
      vehicles[i] = GetVehicle(vehicles[i]);
    }
  }

  return vehicles;
}
