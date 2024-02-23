import { cache, onServerCallback, setVehicleProperties, waitFor } from '@overextended/ox_lib/client';
import { DEBUG } from '../config';

if (DEBUG) import('./parser');

onServerCallback('ox:getNearbyVehicles', (radius: number) => {
  const nearbyEntities: number[] = [];
  const playerCoords = GetEntityCoords(cache.ped, true);

  (GetGamePool('CVehicle') as number[]).forEach((entityId) => {
    const coords = GetEntityCoords(entityId, true);
    const distance = Math.sqrt(
      Math.pow(coords[0] - playerCoords[0], 2) +
        Math.pow(coords[1] - playerCoords[1], 2) +
        Math.pow(coords[2] - playerCoords[2], 2)
    );

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

  for (let index = -1; 0; index++) {
    const ped = GetPedInVehicleSeat(entity, index);

    if (ped && ped !== cache.ped && NetworkGetEntityOwner(ped) === cache.playerId) DeleteEntity(ped);
  }

  await waitFor(async () => {
    if (!IsEntityWaitingForWorldCollision(entity)) return true;
  });

  if (NetworkGetEntityOwner(entity) !== cache.playerId) return;

  const vehicleState = Entity(entity).state;

  SetVehicleOnGroundProperly(entity);
  setTimeout(() => vehicleState.set(key, null, true));
});

AddStateBagChangeHandler('vehicleProperties', '', async (bagName: string, key: string, value: any) => {
  if (!value) return DEBUG && console.info(`removed ${key} state from ${bagName}`);

  const entity = await waitFor(async () => {
    const entity = GetEntityFromStateBagName(bagName);
    DEV: console.info(key, entity);

    if (entity) return entity;
  }, 'failed to get entity from statebag name');

  if (!entity) return;

  if (NetworkGetEntityOwner(entity) !== cache.playerId)
    return DEBUG && console.info(`Cannot set ${key} - player does not own ${bagName}`);

  const vehicleState = Entity(entity).state;

  setVehicleProperties(entity, value);

  setTimeout(() => vehicleState.set(key, null, true));
});
