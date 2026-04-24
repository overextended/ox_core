import { ClassInterface } from 'classInterface';
import { DeleteVehicle, IsPlateAvailable, IsVinAvailable, SaveVehicleData, SetVehicleColumn } from './db';
import {
  getRandomString,
  getRandomAlphanumeric,
  getRandomChar,
  getRandomInt,
  type VehicleProperties,
} from '@communityox/ox_lib';
import { PLATE_PATTERN } from '../../common/config';
import type { Dict, VehicleData } from 'types';
import { GetVehicleData, GetVehicleNetworkType } from '../../common/vehicles';
import { setVehicleProperties } from '@communityox/ox_lib/server';
import { Vector3 } from '@nativewrappers/server';
import { SpawnVehicle } from 'vehicle';

export type Vec3 = number[] | { x: number; y: number; z: number } | { buffer: any };

const setEntityOrphanMode = typeof SetEntityOrphanMode !== 'undefined' ? SetEntityOrphanMode : () => {};

export class OxVehicle extends ClassInterface {
  script: string;
  plate: string;
  model: string;
  make: string;
  id?: number;
  vin: string;
  owner?: number;
  group?: string;
  entity?: number;
  netId?: number;
  #metadata: Dict<any>;
  #properties: Partial<VehicleProperties>;
  #stored: string | null;

  protected static members: Dict<OxVehicle> = {};
  protected static keys: Dict<Dict<OxVehicle>> = {
    id: {},
    netId: {},
    entity: {},
  };

  static spawn(model: string, coords: Vector3, heading?: number) {
    const entityId = CreateVehicleServerSetter(
      model,
      GetVehicleNetworkType(model),
      coords.x,
      coords.y,
      coords.z,
      heading || 0,
    );

    setEntityOrphanMode(entityId, 2);

    return entityId;
  }

  /** Get an instance of OxVehicle with the matching vin. */
  static get(vin: string) {
    const vehicle = this.members[vin];

    if (vehicle) return vehicle;

    return SpawnVehicle(vin);
  }

  /** Get an instance of OxVehicle with the matching vehicleId. */
  static getFromVehicleId(vehicleId: number) {
    return this.keys.id[vehicleId];
  }

  /** Get an instance of OxVehicle with the matching netId. */
  static getFromNetId(id: number) {
    return this.keys.netId[id];
  }

  /** Get an instance of OxVehicle with the matching entityId. */
  static getFromEntity(entityId: number) {
    return this.keys.entity[entityId];
  }

  /** Compares vehicle fields and metadata to a filter, returning the vehicle if all values match. */
  private filter(criteria: Dict<any>) {
    for (const key in criteria) {
      const value = criteria[key];

      if (this[key as keyof OxVehicle] !== value && this.#metadata[key] !== value) return;
    }

    return this;
  }

  /** Get an instance of OxVehicle that matches the filter. */
  static getFromFilter(filter: Dict<any>) {
    for (const id in this.members) {
      const vehicle = this.members[id].filter(filter);
      if (vehicle) return vehicle;
    }
  }

  /** Gets all instances of OxVehicle, optionally comparing against a filter. */
  static getAll(filter?: Dict<any>, asArray?: false): Dict<OxVehicle>;
  static getAll(filter?: Dict<any>, asArray?: true): OxVehicle[];
  static getAll(filter?: Dict<any>, asArray = false): Dict<OxVehicle> | OxVehicle[] {
    if (!filter) return asArray ? Object.values(this.members) : this.members;

    const obj: Dict<OxVehicle> = {};

    for (const id in this.members) {
      const vehicle = this.members[id].filter(filter);
      if (vehicle) obj[id] = vehicle;
    }

    return asArray ? Object.values(obj) : obj;
  }

  static async generateVin({ make, name }: VehicleData, isOwned = true) {
    if (!name) throw new Error('generateVin received invalid VehicleData (invalid model)');

    const arr = [
      getRandomInt(),
      make ? make.slice(0, 2).toUpperCase() : 'OX',
      name.slice(0, 2).toUpperCase(),
      null,
      null,
      Math.floor(Date.now() / 1000),
    ];

    let vin: string;

    while (true) {
      arr[3] = getRandomAlphanumeric();
      arr[4] = getRandomChar();
      vin = arr.join('');

      if (!isOwned || (await IsVinAvailable(vin))) break;
    }

    return isOwned ? vin : `T${vin}`;
  }

  static async generatePlate(pattern: string = PLATE_PATTERN) {
    while (true) {
      const plate = getRandomString(pattern);

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

        vehicle.remove();
      }
    }

    DEV: console.info(`Saving ${parameters.length} vehicles to the database.`);

    if (parameters.length > 0) {
      SaveVehicleData(parameters, true);
      emit('ox:savedVehicles', parameters.length);
    }
  }

  constructor(
    vin: string,
    script: string,
    plate: string,
    model: string,
    make: string,
    stored: string | null,
    metadata: Dict<any>,
    properties: Partial<VehicleProperties>,
    id?: number,
    owner?: number,
    group?: string,
  ) {
    super();
    this.script = script;
    this.plate = plate;
    this.model = model;
    this.make = make;
    this.id = id;
    this.vin = vin;
    this.owner = owner;
    this.group = group;
    this.#properties = properties;
    this.#metadata = metadata || {};
    this.#stored = stored;

    OxVehicle.add(this.vin, this);
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
    return this.entity ? Entity(this.entity).state : null;
  }

  getStored() {
    return this.#stored;
  }

  getProperties() {
    return this.#properties;
  }

  #getSaveData() {
    if (!this.id) return;

    return [this.#stored, JSON.stringify({ ...this.#metadata, properties: this.#properties }), this.id];
  }

  save() {
    const saveData = this.#getSaveData();
    return saveData && SaveVehicleData(saveData);
  }

  despawn(save?: boolean) {
    if (!this.entity) return;

    emit('ox:despawnVehicle', this.entity, this.id);

    const saveData = save && this.#getSaveData();
    if (saveData) SaveVehicleData(saveData);
    if (DoesEntityExist(this.entity)) DeleteEntity(this.entity);
  }

  delete() {
    if (this.id) DeleteVehicle(this.id);

    this.despawn(false);
    OxVehicle.remove(this.vin);
  }

  remove() {
    this.despawn(true);
    OxVehicle.remove(this.vin);
  }

  setStored(value: string | null, despawn?: boolean) {
    this.#stored = value;

    if (despawn) return this.remove();

    SetVehicleColumn(this.id, 'stored', value);
  }

  setOwner(charId?: number) {
    if (this.owner === charId) return;

    charId ? (this.owner = charId) : delete this.owner;

    SetVehicleColumn(this.id, 'owner', this.owner);
  }

  setGroup(group?: string) {
    if (this.group === group) return;

    group ? (this.group = group) : delete this.group;

    SetVehicleColumn(this.id, 'group', this.group);
  }

  setPlate(plate: string) {
    if (this.plate === plate) return;

    this.plate = plate.length > 8 ? plate.substring(0, 8) : plate.padEnd(8);

    SetVehicleColumn(this.id, 'plate', this.plate);
  }

  setProperties(properties: Partial<VehicleProperties>, apply?: boolean) {
    if (!this.entity) return;

    this.#properties = typeof properties === 'string' ? JSON.parse(properties) : properties;

    if (apply) setVehicleProperties(this.entity, this.#properties);
  }

  respawn(coords?: Vec3, rotation: Vector3 | number = 0): number | null {
    const hasEntity = !!this.entity && DoesEntityExist(this.entity);

    if (!coords && hasEntity) {
      coords = GetEntityCoords(this.entity as number);
    } else if (coords) {
      coords = Vector3.fromObject(coords);
    }

    if (!coords) return null;

    rotation =
      typeof rotation === 'number'
        ? rotation
        : Vector3.fromObject(rotation || hasEntity ? GetEntityRotation(this.entity as number) : null);

    // Clean up existing entity and registry entries before spawning new one
    if (hasEntity) {
      emit('ox:despawnVehicle', this.entity, this.id);
      DeleteEntity(this.entity as number);
    }

    // Remove from registry before creating new entity to avoid conflicts
    OxVehicle.remove(this.vin);

    // Create new entity
    this.entity = OxVehicle.spawn(this.model, coords as Vector3, typeof rotation === 'number' ? rotation : 0);
    this.netId = NetworkGetNetworkIdFromEntity(this.entity);

    if (typeof rotation !== 'number') SetEntityRotation(this.entity, rotation.x, rotation.y, rotation.z, 2, false);

    // Re-add to registry after successful spawn
    OxVehicle.add(this.vin, this);
    SetVehicleNumberPlateText(this.entity, this.#properties.plate || this.plate);
    setVehicleProperties(this.entity, this.#properties);
    emit('ox:spawnedVehicle', this.entity, this.id);

    const state = this.getState();

    if (state) state.set('initVehicle', true, true);

    return this.entity;
  }
}

OxVehicle.init();

exports('SaveAllVehicles', (arg: any) => OxVehicle.saveAll(arg));
exports('GetVehicleFromNetId', (arg: any) => OxVehicle.getFromNetId(arg));
exports('GetVehicleFromVin', (arg: any) => OxVehicle.get(arg));
exports('GetVehicleFromEntity', (arg: any) => OxVehicle.getFromEntity(arg));
exports('GetVehicleFromFilter', (arg: any) => OxVehicle.getFromFilter(arg))
exports('GetVehicles', (arg: any) => OxVehicle.getAll(arg, true));
exports('GenerateVehicleVin', (model: string) => OxVehicle.generateVin(GetVehicleData(model)));
exports('GenerateVehiclePlate', (pattern?: string) => OxVehicle.generatePlate(pattern));
