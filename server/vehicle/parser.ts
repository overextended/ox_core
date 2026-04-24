import { addCommand, triggerClientCallback } from '@communityox/ox_lib/server';
import { GetTopVehicleStats, GetVehicleData } from '../../common/vehicles';
import type { VehicleData, TopVehicleStats } from 'types';

function SortObjectProperties(obj: object) {
  return Object.fromEntries(Object.entries(obj).sort());
}

addCommand<{ parseAll: boolean }>(
  'parsevehicles',
  async (playerId, args) => {
    const response: [Record<string, VehicleData>, TopVehicleStats, string[]] | void = await triggerClientCallback(
      'ox:generateVehicleData',
      playerId,
      args.parseAll,
    );

    if (!response) return;

    const updatedVehicles = args.parseAll ? SortObjectProperties({ ...response[0] }) : SortObjectProperties({ ...GetVehicleData(), ...response[0] });
    const updatedStats = args.parseAll ? SortObjectProperties({ ...response[1] }) : SortObjectProperties({ ...GetTopVehicleStats(), ...response[1] });

    if (response[2].length)
      console.log(
        `^3Failed to parse data for ${response[2].length} invalid vehicles.\n${JSON.stringify(response[2], null, 2)}^0`,
      );

    SaveResourceFile('ox_core', '/common/data/vehicleStats.json', JSON.stringify(updatedStats, null, 2), -1);
    SaveResourceFile('ox_core', '/common/data/vehicles.json', JSON.stringify(updatedVehicles, null, 2), -1);
  },
  {
    help: 'Parses and generates vehicle data for all vehicle models available on a client.',
    params: [{ name: 'parseAll', optional: true, help: 'Include vehicles with existing data in the data generation.' }],
    restricted: 'group.admin',
  },
);
