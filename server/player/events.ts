import { onClientCallback } from '@overextended/ox_lib/server';
import { OxPlayer } from './class';

type ScopeEvent = { player: string; for: string };

on('playerEnteredScope', (data: ScopeEvent) => {
  DEV: console.info(`Player ${data.for} entered the scope of Player ${data.player}`);
  const player = OxPlayer.get(data.for);

  if (player) player.getPlayersInScope()[data.player] = true;
});

on('playerLeftScope', (data: ScopeEvent) => {
  DEV: console.info(`Player ${data.for} left the scope of Player ${data.player}`);
  const player = OxPlayer.get(data.for);

  if (player) delete player.getPlayersInScope()[data.player];
});

onNet('ox:setActiveCharacter', async (data: number | NewCharacter) => {
  const player = OxPlayer.get(source);

  if (!player) return;

  return await player.setActiveCharacter(data);
});

onClientCallback('ox:deleteCharacter', async (playerId, charId: number) => {
  const player = OxPlayer.get(playerId);

  if (!player) return;

  return await player.deleteCharacter(charId);
});
