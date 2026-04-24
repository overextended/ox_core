import { onClientCallback } from '@communityox/ox_lib/server';
import { OxPlayer } from './class';
import { sleep } from '@communityox/ox_lib';
import { db } from 'db';
import { Statuses } from './status';
import { CreateNewAccount } from 'accounts/db';
import type { Dict, NewCharacter, OxStatus } from 'types';
import { CREATE_DEFAULT_ACCOUNT } from 'config';
import './license';

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

  await sleep(1000);

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
  db.execute('INSERT INTO character_inventory (charId) VALUES (?)', [charId]);

  if (CREATE_DEFAULT_ACCOUNT) CreateNewAccount(charId, 'Personal', true);
});

onNet('ox:updateStatuses', async (data: Dict<OxStatus>) => {
  const player = OxPlayer.get(source);

  if (!player) return;

  for (const name in data) {
    const status = Statuses[name];
    const value = data[name];

    if (status && typeof value === 'number') {
      player.setStatus(name, value);
    }
  }
});

onClientCallback('ox:setActiveGroup', (playerId, groupName: string) => {
  const player = OxPlayer.get(playerId);

  if (!player) return false;

  return player.setActiveGroup(groupName);
});

onClientCallback('ox:getLicense', (playerId, licenseName: string, target?: number) => {
  const player = OxPlayer.get(target || playerId);

  if (player) return licenseName ? player.getLicense(licenseName) : player.getLicenses();
});

on('txAdmin:events:playerHealed', ({ target, author }: { target: number, author: string }) => {
  if (target === -1) {
    const players = OxPlayer.getAll();

    for (const id in players) {
      const state = Player(id).state;
      
      state.set('isDead', false, true);
    }
  } else {
    const state = Player(target).state;
    
    state.set('isDead', false, true);
  }  
});
