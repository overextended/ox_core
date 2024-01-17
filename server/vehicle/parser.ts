import { addCommand, triggerClientCallback } from '@overextended/ox_lib/server';
import { GetTopVehicleStats, GetVehicleData, TopVehicleStats, VehicleData } from '../../common/vehicles';

function SortObjectProperties(obj: object) {
  return Object.fromEntries(Object.entries(obj).sort());
}

addCommand<{ parseAll: boolean }>(
  'parsevehicles',
  async (playerId, args) => {
    const response: [Record<string, VehicleData>, TopVehicleStats] | void = await triggerClientCallback(
      'ox:generateVehicleData',
      playerId,
      args.parseAll
    );

    if (!response) return;

    const updatedVehicles = SortObjectProperties({ ...GetVehicleData(), ...response[0] });
    const updatedStats = SortObjectProperties({ ...GetTopVehicleStats(), ...response[1] });

    SaveResourceFile('ox_core', '/common/data/vehicleStats.json', JSON.stringify(updatedStats, null, 2), -1);
    SaveResourceFile('ox_core', '/common/data/vehicles.json', JSON.stringify(updatedVehicles, null, 2), -1);
  },
  {
    help: 'Parses and generates vehicle data for all vehicle models available on a client.',
    params: [{ name: 'parseAll', optional: true, help: 'Include vehicles with existing data in the data generation.' }],
    restricted: 'group.admin',
  }
);
