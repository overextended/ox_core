import 'player/loading';
import 'player/events';
import { OxPlayer } from './class';
import { Sleep } from '../../common';

const playerLoadEvents: Dict<Function> = {};
const playerLogoutEvents: Function[] = [];

/** Triggers a callback when a player is fully loaded, or when the resource starts.  */
export function OnPlayerLoaded(resource: string, cb: (player: OxPlayer) => void) {
  playerLoadEvents[resource] = cb;
}

/** Triggers a callback when a player logs out. */
export function OnPlayerLogout(cb: (player: OxPlayer) => void) {
  playerLogoutEvents.push(cb);
}

on('ox:playerLoaded', (playerId: string | number) => {
  for (const resource in playerLoadEvents) {
    const player = OxPlayer.get(playerId);

    if (player.charId)
      try {
        playerLoadEvents[resource](player);
      } catch (e) {
        DEV: console.info(e.message);
      }
  }
});

on('onServerResourceStart', async (resource: string) => {
  const event = playerLoadEvents[resource];

  if (!event) return;

  await Sleep(1000);

  const players = OxPlayer.getAll();

  for (const id in players) {
    const player = players[id];

    if (player.charId)
      try {
        event(player);
      } catch (e) {
        DEV: console.info(e.message);
      }
  }
});

on('ox:playerLogout', (playerId: number) => {
  const player = OxPlayer.get(playerId);

  if (player.charId)
    for (const i in playerLogoutEvents)
      try {
        playerLogoutEvents[i](player);
      } catch (e) {
        DEV: console.info(e.message);
      }
});

on('onResourceStop', (resource: string) => {
  if (resource !== 'ox_core') return;

  const players = OxPlayer.getAll();

  for (const id in players) {
    const player = players[id];

    if (player.charId) emit('ox:playerLogout', player.source, player.userId, player.charId);
  }
});

/**
 * Sets an interval to save every 10 minutes.
 * @todo Consider performance on servers with a high player-count.
 * Multiple staggered saves may improve load.
 */
setInterval(() => OxPlayer.saveAll(), 600000);
