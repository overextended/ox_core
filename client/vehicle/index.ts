import {
  cache,
  getVehicleProperties,
  onServerCallback,
  setVehicleProperties,
  waitFor,
} from '@overextended/ox_lib/client';
import { Vector3 } from '@nativewrappers/fivem';
import { DEBUG } from '../config';

if (DEBUG) import('./parser');

onServerCallback('ox:getNearbyVehicles', (radius: number) => {
  const nearbyEntities: number[] = [];
  const playerCoords = Vector3.fromArray(GetEntityCoords(cache.ped, true));

  (GetGamePool('CVehicle') as number[]).forEach((entityId) => {
    const coords = Vector3.fromArray(GetEntityCoords(entityId, true));
    const distance = coords.distance(playerCoords);

    if (distance <= (radius || 2) && NetworkGetEntityIsNetworked(entityId)) nearbyEntities.push(VehToNet(entityId));
  });

  return nearbyEntities;
});

AddStateBagChangeHandler('initVehicle', '', async (bagName: string, key: string, value: any) => {
  if (!value) return;

  const entity = await waitFor(async () => {
    const entity = GetEntityFromStateBagName(bagName);
    DEV: console.info(key, entity);

    if (entity) return entity;
  }, 'failed to get entity from statebag name');

  if (!entity) return;

  await waitFor(async () => {
    if (!IsEntityWaitingForWorldCollision(entity)) return true;
  });

  if (NetworkGetEntityOwner(entity) !== cache.playerId) return;

  SetVehicleOnGroundProperly(entity);
  setTimeout(() => Entity(entity).state.set(key, null, true));
});

function doesfivemworkyet(obj1: any, obj2: any) {
  for (let key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        if (!doesfivemworkyet(obj1[key], obj2[key])) {
          return false;
        }
      } else {
        if (obj2[key] !== obj1[key]) {
          return false;
        }
      }
    }
  }
  return true;
}

AddStateBagChangeHandler('vehicleProperties', '', async (bagName: string, key: string, value: any) => {
  if (!value) return DEBUG && console.info(`removed ${key} state from ${bagName}`);

  const entity = await waitFor(async () => {
    const entity = GetEntityFromStateBagName(bagName);
    DEV: console.info(key, entity);

    if (entity) return entity;
  }, 'failed to get entity from statebag name');

  if (!entity) return;

  // properties and serverside vehicles are one of the most retarded features of fivem
  // let's set this dumb bullshit in an interval and see if they actually bother setting
  await new Promise((resolve) => {
    let i = 0;
    let interval: CitizenTimer;

    interval = setInterval(() => {
      i++;

      if (i > 10 || !DoesEntityExist(entity)) {
        resolve(i > 10 ? 1 : 0);
        return clearInterval(interval);
      }

      setVehicleProperties(entity, value);
    }, 100);
  });

  const properties = getVehicleProperties(entity);

  if (!doesfivemworkyet(value, properties))
    console.error(`vehicle properties probably didn't fully set properly. thanks fivem.`);

  Entity(entity).state.set(key, null, true);
});
