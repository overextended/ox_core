import { ClassInterface } from 'classInterface';
import { DeleteVehicle, IsPlateAvailable, IsVinAvailable, SaveVehicleData, SetVehicleColumn } from './db';
import { getRandomString, getRandomAlphanumeric, getRandomChar, getRandomInt } from '@overextended/ox_lib';
import { PLATE_PATTERN } from '../../common/config';
import type { Dict, VehicleData } from 'types';
import { GetVehicleData } from '../../common/vehicles';

export class OxVehicle extends ClassInterface {
  entity: number;
  netId: number;
  script: string;
  plate: string;
  model: string;
  make: string;
  id?: number;
  vin?: string;
  owner?: number;
  group?: string;
  #metadata: Dict<any>;
  #stored: string | null;

  protected static members: Dict<OxVehicle> = {};
  protected static keys: Dict<Dict<OxVehicle>> = {
    id: {},
    netId: {},
    vin: {},
  };

  /** Get an instance of OxVehicle with the matching entityId. */
  static get(entityId: string | number) {
    return this.members[entityId];
  }

  /** Get an instance of OxVehicle with the matching vehicleId. */
  static getFromVehicleId(vehicleId: number) {
    return this.keys.id[vehicleId];
  }

  /** Get an instance of OxVehicle with the matching netId. */
  static getFromNetId(id: number) {
    return this.keys.netId[id];
  }

  /** Get an instance of OxVehicle with the matching vin. */
  static getFromVin(vin: string) {
    return this.keys.vin[vin];
  }

  /** Gets all instances of OxVehicle. */
  static getAll(): Dict<OxVehicle> {
    return this.members;
  }

  static async generateVin({ make, name }: VehicleData) {
    if (!name) throw new Error(`generateVin received invalid VehicleData (invalid model)`);

    const arr = [
      getRandomInt(),
      make ? make.slice(0, 2).toUpperCase() : 'OX',
      name.slice(0, 2).toUpperCase(),
      null,
      null,
      Math.floor(Date.now() / 1000),
    ];

    while (true) {
      arr[3] = getRandomAlphanumeric();
      arr[4] = getRandomChar();
      const vin = arr.join('');

      if (await IsVinAvailable(vin)) return vin;
    }
  }

  static async generatePlate() {
    while (true) {
      const plate = getRandomString(PLATE_PATTERN);

      if (await IsPlateAvailable(plate)) return plate;
    }
  }

  static saveAll(resource?: string) {
    if (resource === 'ox_core') resource = '';

    const parameters = [];

    for (const id in this.members) {
      const vehicle = this.members[id];

      if (!resource || resource === vehicle.script) {
        if (vehicle.owner || vehicle.group) {
          vehicle.#stored = 'impound';
          parameters.push(vehicle.#getSaveData());
        }

        vehicle.despawn();
      }
    }

    DEV: console.info(`Saving ${parameters.length} vehicles to the database.`);

    if (parameters.length > 0) {
      SaveVehicleData(parameters, true);
      emit('ox:savedVehicles', parameters.length);
    }
  }

  constructor(
    entity: number,
    script: string,
    plate: string,
    model: string,
    make: string,
    stored: string | null,
    metadata: Dict<any>,
    id?: number,
    vin?: string,
    owner?: number,
    group?: string
  ) {
    super();
    this.entity = entity;
    this.netId = NetworkGetNetworkIdFromEntity(entity);
    this.script = script;
    this.plate = plate;
    this.model = model;
    this.make = make;
    this.id = id;
    this.vin = vin;
    this.owner = owner;
    this.group = group;
    this.#metadata = metadata || {};
    this.#stored = stored;

    OxVehicle.add(this.entity, this);
    SetVehicleNumberPlateText(this.entity, this.plate);
    emit('ox:spawnedVehicle', this.entity, this.id);
  }

  /** Stores a value in the vehicle's metadata. */
  set(key: string, value: any) {
    this.#metadata[key] = value;
  }

  /** Gets a value stored in vehicle's metadata. */
  get(key: string) {
    return this.#metadata[key];
  }

  getState() {
    return Entity(this.entity).state;
  }

  #getSaveData() {
    if (!this.id) return;

    return [this.#stored, JSON.stringify(this.#metadata), this.id];
  }

  save() {
    const saveData = this.#getSaveData();
    return saveData && SaveVehicleData(saveData);
  }

  despawn(save?: boolean) {
    const saveData = save && this.#getSaveData();
    if (saveData) SaveVehicleData(saveData);
    if (DoesEntityExist(this.entity)) DeleteEntity(this.entity);

    OxVehicle.remove(this.entity);
  }

  delete() {
    if (this.id) DeleteVehicle(this.id);
    this.despawn(false);
  }

  setStored(value: string | null, despawn?: boolean) {
    this.#stored = value;

    if (despawn) return this.despawn(true);

    SetVehicleColumn(this.id, 'stored', value);
  }

  setOwner(charId?: number) {
    if (this.owner === charId) return;

    charId ? (this.owner = charId) : delete this.owner;

    SetVehicleColumn(this.id, 'owner', this.group);
  }

  setGroup(group?: string) {
    if (this.group === group) return;

    group ? (this.group = group) : delete this.group;

    SetVehicleColumn(this.id, 'group', this.group);
  }

  setPlate(plate: string) {
    if (this.plate === plate) return;

    this.plate = plate.padEnd(8);

    SetVehicleColumn(this.id, 'plate', this.plate);
  }
}

OxVehicle.init();

exports('SaveAllVehicles', (arg: any) => OxVehicle.saveAll(arg));
exports('GetVehicleFromNetId', (arg: any) => OxVehicle.getFromNetId(arg));
exports('GetVehicleFromVin', (arg: any) => OxVehicle.getFromVin(arg));
exports('GenerateVehicleVin', (model: string) => OxVehicle.generateVin(GetVehicleData(model)));
exports('GenerateVehiclePlate', () => OxVehicle.generatePlate());
