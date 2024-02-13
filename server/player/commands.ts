import { addCommand } from '@overextended/ox_lib/server';
import { OxPlayer } from 'player/class';

addCommand('logout', async (playerId) => OxPlayer.get(playerId).logout(), {
  help: 'Logout and return to character selection.',
  restricted: 'group.admin',
});

addCommand(
  'charinfo',
  async (playerId) => {
    const player = OxPlayer.get(playerId);
    console.log(`${player.get('firstName')} ${player.get('lastName')} (${player.charId}) - ${player.stateId}`);
  },
  {
    help: 'Display basic character information.',
  }
);
