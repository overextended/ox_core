import { ClassInterface } from 'classInterface';

export class OxVehicle extends ClassInterface {
  vehicleId: number;

  constructor(id: number) {
    super();

    this.vehicleId = id;

    OxVehicle.add(id.toString(), this);
  }

  static get(id: string | number): OxVehicle {
    return this.members[id.toString()];
  }

  static getAll(): Dict<OxVehicle> {
    return this.members;
  }

  print(...args: any) {
    console.log('publicmethod', ...args);
  }

  getVehicleId() {
    return this.vehicleId;
  }

  /** temporary call method for easy bindings */
  call = (fn: string, ...args: any) => {
    const prop = (this as any)[fn];

    if (typeof prop === 'function') return prop(...args);

    return prop;
  };
}

OxVehicle.init();
