import { OxPlayer } from 'player/class';

RegisterCommand(
  'logout',
  (playerId: number) => {
    const player = OxPlayer.get(playerId);
    player?.logout(false);
  },
  true
);
