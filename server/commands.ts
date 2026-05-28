import { addCommand } from '@overextended/ox_lib/server';
import { OxPlayer } from 'player/class';
import { OxVehicle } from 'vehicle/class';

addCommand(
  'saveall',
  async () => {
    OxPlayer.saveAll();
    OxVehicle.saveAll();
  },
  {
    help: 'Saves all players and vehicles to the database.',
    restricted: 'group.admin',
  },
);
