const exp = exports.ox_core.CVehicle;

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

  delete() {
    exp(this.entity, "delete");
  }

  store(value: string) {
    exp(this.entity, "store", value);
  }
}

export function GetVehicle(vehicle: number | ICVehicle) {
  vehicle =
    typeof vehicle === "object" && vehicle?.entity ? vehicle : (exports.ox_core.GetPlayer(vehicle) as ICVehicle);
  return new CVehicle(vehicle);
}

export function GetVehicleFromNetId(netid: number) {
  const entity = NetworkGetEntityFromNetworkId(netid);
  return GetVehicle(entity);
}

// TODO: objectify the unobjectified coords object
export async function CreateVehicle(
  data: { model: string; stored: number; properties?: { [key: string]: any }; owner?: string },
  coords: Object,
  heading: number
) {
  const vehicle: ICVehicle = await exports.ox_core.CreateVehicle(data, coords, heading);
  return new CVehicle(vehicle);
}

export function GetVehicles(useclass?: boolean) {
  const vehicles: CVehicle[] = exports.ox_core.GetVehicles();

  if (useclass) {
    for (let i = 0; i === vehicles.length - 1; i++) {
      vehicles[i] = GetVehicle(vehicles[i]);
    }
  }

  return vehicles;
}
