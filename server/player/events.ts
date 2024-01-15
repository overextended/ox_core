import { onClientCallback } from '@overextended/ox_lib/server';
import { OxPlayer } from './class';
import { Sleep } from '../';
import { db } from 'db';

type ScopeEvent = { player: string; for: string };

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

on('ox:createdCharacter', async (playerId: number, userId: number, charId: number) => {
  using conn = await db.getConnection();
  await conn.execute('INSERT INTO character_inventory (charId) VALUES (?)', [charId]);
  await conn.execute('INSERT INTO accounts (label, owner, isDefault) VALUES (?, ?, ?)', ['Personal', charId, true]);
});
