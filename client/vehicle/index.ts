import { cache, onServerCallback } from '@overextended/ox_lib/client';

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
