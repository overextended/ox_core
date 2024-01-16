import { addCommand, triggerClientCallback } from '@overextended/ox_lib/server';
import { OxVehicle } from './class';
import { Sleep } from '../../common';
import { CreateVehicle } from 'vehicle';
import { OxPlayer } from 'player/class';

export function DeleteCurrentVehicle(ped: number) {
  const entity = GetVehiclePedIsIn(ped, false);

  if (!entity) return;

  const vehicle = OxVehicle.get(entity);

  vehicle ? vehicle.despawn(true) : DeleteEntity(entity);
}

addCommand<{ model: string; owner?: number }>(
  'car',
  async (playerId, args, raw) => {
    const ped = GetPlayerPed(playerId as any);
    const player = args.owner && OxPlayer.get(args.owner);
    const data = {
      model: args.model,
      owner: player?.charId || undefined,
    };

    const entity = await CreateVehicle(data, GetEntityCoords(ped), GetEntityHeading(ped));

    if (!entity) return;

    DeleteCurrentVehicle(ped);
    await Sleep(200);
    SetPedIntoVehicle(ped, entity, -1);
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
      else if (args.owned) vehicle.despawn(true);
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
