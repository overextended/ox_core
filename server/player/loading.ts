import { OxPlayer, PlayerInstance } from 'player/class';
import { CreateUser, GetUserIdFromIdentifier } from './db';
import { GetIdentifiers, GetPlayerLicense } from 'utils';
import { DEBUG, SV_LAN } from '../config';
import type { Dict } from 'types';

const connectingPlayers: Dict<PlayerInstance> = {};

/** Loads existing data for the player, or inserts new data into the database. */
async function loadPlayer(playerId: number) {
  if (serverLockdown) return serverLockdown;

  const player = new OxPlayer(playerId);
  const license = SV_LAN ? 'fayoum' : GetPlayerLicense(playerId);

  if (!license) return `could not validate player license.`;

  const identifier = license.substring(license.indexOf(':') + 1);
  let userId = await GetUserIdFromIdentifier(identifier);

  if (userId && OxPlayer.getFromUserId(userId)) {
    const kickReason = `userId '${userId}' is already active.`;

    if (!DEBUG) return kickReason;

    userId = await GetUserIdFromIdentifier(identifier, 1);

    if (userId && OxPlayer.getFromUserId(userId)) return kickReason;
  }

  player.username = GetPlayerName(player.source as string);
  player.userId = userId ? userId : await CreateUser(player.username, GetIdentifiers(playerId));
  player.identifier = identifier;

  DEV: console.info(`Loaded player data for OxPlayer<${player.userId}>`);

  return player;
}

let serverLockdown: string;

setInterval(() => {
  for (const tempId in connectingPlayers) {
    if (!DoesPlayerExist(tempId)) delete connectingPlayers[tempId];
  }
}, 10000);

on('txAdmin:events:serverShuttingDown', () => {
  serverLockdown = 'The server is about to restart. You cannot join at this time.';
  OxPlayer.saveAll('Server is restarting.');
});

on('playerConnecting', async (username: string, _: any, deferrals: any) => {
  const tempId = source;

  deferrals.defer();

  if (serverLockdown) return deferrals.done(serverLockdown);

  const player = await loadPlayer(tempId);

  if (!(player instanceof OxPlayer)) return deferrals.done(player || `Failed to load player.`);

  connectingPlayers[tempId] = player;

  deferrals.done();
});

on('playerJoining', async (tempId: string) => {
  if (serverLockdown) return DropPlayer(source.toString(), serverLockdown);

  const player = connectingPlayers[tempId];

  if (!player) return;

  delete connectingPlayers[tempId];
  connectingPlayers[source] = player;
  player.source = source;

  DEV: console.info(`Assigned id ${source} to OxPlayer<${player.userId}>`);
});

onNet('ox:playerJoined', async () => {
  const playerSrc = source;
  const player = connectingPlayers[playerSrc] || (await loadPlayer(playerSrc));
  delete connectingPlayers[playerSrc];

  if (!(player instanceof OxPlayer)) return DropPlayer(playerSrc.toString(), player || `Failed to load player.`);

  player.setAsJoined();
});

on('playerDropped', () => {
  const player = OxPlayer.get(source);

  if (!player) return;

  player.logout(true, true);
  OxPlayer.remove(player.source);

  DEV: console.info(`Dropped OxPlayer<${player.userId}>`);
});

RegisterCommand(
  'saveplayers',
  () => {
    OxPlayer.saveAll();
  },
  true
);
