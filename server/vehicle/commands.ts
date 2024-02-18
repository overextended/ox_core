import { addCommand, triggerClientCallback } from '@overextended/ox_lib/server';
import { OxVehicle } from './class';
import { sleep } from '@overextended/ox_lib';
import { CreateVehicle } from 'vehicle';
import { OxPlayer } from 'player/class';

export function DeleteCurrentVehicle(ped: number) {
  const entity = GetVehiclePedIsIn(ped, false);

  if (!entity) return;

  const vehicle = OxVehicle.get(entity);

  vehicle ? vehicle.setStored('impound', true) : DeleteEntity(entity);
}

addCommand<{ model: string; owner?: number }>(
  'car',
  async (playerId, args, raw) => {
    const ped = playerId && GetPlayerPed(playerId as any);

    if (!ped) return;

    const player = args.owner ? OxPlayer.get(args.owner) : null;
    const data = {
      model: args.model,
      owner: player?.charId || undefined,
    };

    const vehicle = await CreateVehicle(data, GetEntityCoords(ped), GetEntityHeading(ped));

    if (!vehicle) return;

    DeleteCurrentVehicle(ped);
    await sleep(200);
    SetPedIntoVehicle(ped, vehicle.entity, -1);
  },
  {
    help: `Spawn a vehicle with the given model.`,
    params: [
      { name: 'model', paramType: 'string', help: 'The vehicle archetype.' },
      {
        name: 'owner',
        paramType: 'playerId',
        help: "Create a persistent vehicle owned by the target's active character.",
        optional: true,
      },
    ],
    restricted: 'group.admin',
  }
);

addCommand<{ radius?: number; owned?: string }>(
  'dv',
  async (playerId, args, raw) => {
    const ped = GetPlayerPed(playerId as any);

    if (!args.radius) return DeleteCurrentVehicle(ped);

    const vehicles = await triggerClientCallback<number[]>('ox:getNearbyVehicles', playerId, args.radius);

    if (!vehicles) return;

    vehicles.forEach((netId) => {
      const vehicle = OxVehicle.getFromNetId(netId);

      if (!vehicle) DeleteEntity(NetworkGetEntityFromNetworkId(netId));
      else if (args.owned) vehicle.setStored('impound', true);
    });
  },
  {
    help: `Deletes your current vehicle, or any vehicles within range.`,
    params: [
      { name: 'radius', paramType: 'number', help: 'The radius to despawn vehicles (defaults to 2).', optional: true },
      { name: 'owned', help: 'Include player-owned vehicles.', optional: true },
    ],
    restricted: 'group.admin',
  }
);
