import { ClassInterface } from 'classInterface';
import { CreateVehicle } from './index';
import { DeleteVehicle, GetVehicleFromVin, IsPlateAvailable, IsVinAvailable, SaveVehicleData, SetVehicleColumn } from './db';
import {
  getRandomString,
  getRandomAlphanumeric,
  getRandomChar,
  getRandomInt,
  VehicleProperties,
} from '@overextended/ox_lib';
import { PLATE_PATTERN } from '../../common/config';
import type { Dict, VehicleData } from 'types';
import { GetVehicleData, GetVehicleNetworkType } from '../../common/vehicles';
import { setVehicleProperties } from '@overextended/ox_lib/server';
import { Vector3 } from '@nativewrappers/fivem';
import { GenerateUUID } from '../utils';

type Vec3 = number[] | { x: number; y: number; z: number } | { buffer: any };

const setEntityOrphanMode = typeof SetEntityOrphanMode !== 'undefined' ? SetEntityOrphanMode : () => { };

export class OxVehicle extends ClassInterface {
  internalId: string;
  script: string;
  plate: string;
  model: string;
  make: string;
  id?: number;
  entity?: number;
  netId?: number;
  vin?: string;
  owner?: number;
  group?: string;
  #metadata: Dict<any>;
  #properties: VehicleProperties;
  #stored: string | null;

  protected static members: Dict<OxVehicle> = {};
  protected static keys: Dict<Dict<OxVehicle>> = {
    id: {},
    entity: {},
    netId: {},
    vin: {},
  };

  static spawn(model: string, coords: Vector3, heading?: number) {
    const entityId = CreateVehicleServerSetter(
      model,
      GetVehicleNetworkType(model),
      coords.x,
      coords.y,
      coords.z,
      heading || 0
    );

    setEntityOrphanMode(entityId, 2);

    return entityId;
  }

  /** Get an instance of OxVehicle with the matching entityId. */
  static get(entityId: string | number) {
    // If the entityId is a string, it's the internalId
    if (typeof entityId === 'string') return this.members[entityId];

    return this.keys.entity[entityId];
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
  static async getFromVin(vin: string) {
    if (this.keys.vin[vin]) {
      return this.keys.vin[vin];
    }

    const vehicleDb = await GetVehicleFromVin(vin)
    if (!vehicleDb) return;

    const vehicle = await CreateVehicle(vehicleDb);
    return vehicle;
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
    script: string,
    plate: string,
    model: string,
    make: string,
    stored: string | null,
    metadata: Dict<any>,
    properties: VehicleProperties,
    id?: number,
    entity?: number,
    vin?: string,
    owner?: number,
    group?: string
  ) {
    super();
    this.internalId = GenerateUUID();
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

    if (entity && entity > 0) {
      this.entity = entity;
      this.netId = NetworkGetNetworkIdFromEntity(entity);

      if (this.id) {
        this.setStored(null, false);
      }

      SetVehicleNumberPlateText(this.entity, properties.plate || this.plate);
      setVehicleProperties(entity, properties);
      emit('ox:spawnedVehicle', this.entity, this.id);

      const state = this.getState();

      state.set('initVehicle', true, true);
    }

    OxVehicle.add(this.internalId, this);
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
    if (!this.entity) {
      throw new Error('Vehicle does not have an entity');
    }
    return Entity(this.entity).state;
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
    const saveData = save && this.#getSaveData();
    if (saveData) SaveVehicleData(saveData);
    if (this.entity && DoesEntityExist(this.entity)) DeleteEntity(this.entity);

    this.untrack();
  }

  delete() {
    if (this.id) DeleteVehicle(this.id);
    this.despawn(false);
  }

  untrack() {
    OxVehicle.remove(this.internalId);
  }

  setStored(value: string | null, despawn?: boolean) {
    this.#stored = value;

    if (despawn) return this.despawn(true);

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

  setProperties(properties: VehicleProperties, apply?: boolean) {
    this.#properties = properties;

    if (apply && this.entity && DoesEntityExist(this.entity)) setVehicleProperties(this.entity, this.#properties);
  }

  async respawn(coords?: Vec3, rotation?: Vec3) {
    const hasEntity = this.entity !== undefined && DoesEntityExist(this.entity);

    if (coords) {
      coords = Vector3.fromObject(coords);
    } else if (hasEntity) {
      coords = GetEntityCoords(this.entity!);
    } else {
      throw new Error('Cannot respawn vehicle without entity existing or coords provided');
    }

    if (rotation) {
      rotation = Vector3.fromObject(rotation);
    } else if (hasEntity) {
      rotation = GetEntityRotation(this.entity!);
    } else {
      rotation = new Vector3(0, 0, 0);
    }

    coords = coords as Vector3;
    rotation = rotation as Vector3;

    if (hasEntity) DeleteEntity(this.entity!);

    this.entity = OxVehicle.spawn(this.model, coords as Vector3, 0);
    this.netId = NetworkGetNetworkIdFromEntity(this.entity);

    if (rotation) SetEntityRotation(this.entity, rotation.x, rotation.y, rotation.z, 2, false);

    SetVehicleNumberPlateText(this.entity, this.#properties.plate || this.plate);
    setVehicleProperties(this.entity, this.#properties);
    emit('ox:spawnedVehicle', this.entity, this.id);
  }
}

OxVehicle.init();

exports('SaveAllVehicles', (arg: any) => OxVehicle.saveAll(arg));
exports('GetVehicleFromNetId', (arg: any) => OxVehicle.getFromNetId(arg));
exports('GetVehicleFromVin', (arg: any) => OxVehicle.getFromVin(arg));
exports('GenerateVehicleVin', (model: string) => OxVehicle.generateVin(GetVehicleData(model)));
exports('GenerateVehiclePlate', () => OxVehicle.generatePlate());
