import { Dict } from 'types';

const playerData = GetResourceState('ox_core') === 'started' ? exports.ox_core.GetPlayerData() : {};
playerData.toString = () => JSON.stringify(playerData, null, 2);

const player = new Proxy(playerData, {
  get(target, key: string) {
    if (key in target) return target[key];
    if (key in playerData) return playerData[key];
    if (!playerData.charId) return;

    console.log(`make handler ox:player:${key}`);
    on(`ox:player:${key}`, (data: any) => {
      console.log(`trigger handler ox:player:${key}`);
      if (GetInvokingResource() == 'ox_core' && (source as any) === '') target[key] = data;
    });

    const value = exports.ox_core.GetPlayerData(key) || null;
    target[key] = value;

    return value;
  },
});

const groups: Dict<number> = {};

export function OxPlayer() {
  return player;
}

on('ox:playerLoaded', (data: Dict<any>) => {
  if (playerData.charId) return;

  for (const key in data) player[key] = data[key];
});

on('ox:playerLogout', () => {
  for (const key in player) delete player[key];
});

onNet('ox:setGroup', (name: string, grade: number) => {
  if ((source as any) === '') return;

  groups[name] = grade;
});
