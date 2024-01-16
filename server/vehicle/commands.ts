import { addCommand } from '@overextended/ox_lib/server';
import { OxVehicle } from './class';
import { Sleep } from '../../common';
import { CreateVehicle } from 'vehicle';

export function DeleteCurrentVehicle(ped: number) {
  const entity = GetVehiclePedIsIn(ped, false);

  if (!entity) return;

  const vehicle = OxVehicle.get(entity);

  vehicle ? vehicle.despawn(true) : DeleteEntity(entity);
}

addCommand<{ model: string; owner: number }>(
  'car',
  async (playerId, args, raw) => {
    // const player = args.owner && OxPlayer.get(args.owner);
    const ped = GetPlayerPed(playerId as any);
    const vehicle = await CreateVehicle(args.model, GetEntityCoords(ped), GetEntityHeading(ped));

    if (!vehicle) return;

    DeleteCurrentVehicle(ped);
    await Sleep(100);
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

    // @todo delete nearby vehicles
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
