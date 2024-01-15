import { netEvent } from 'utils';

export let playerIsLoaded = false;
export const playerState = LocalPlayer.state;
export const playerData: Dict<any> = {};
export const playerMetadata: Dict<any> = {};
export const playerGroups: Dict<number> = {};

export function SetPlayerLoaded(state: boolean) {
  playerIsLoaded = state;
}

export function SetPlayerData(userId: number, charId: number, stateId: string, groups: Record<string, number>) {
  playerData.userId = userId;
  playerData.charId = charId;
  playerData.stateId = stateId;

  for (const key in groups) {
    playerGroups[key] = groups[key];
  }

  DEV: {
    console.log(playerData);
    console.log(playerMetadata);
    console.log(playerGroups);
  }
}

exports('isPlayerLoaded', () => playerIsLoaded);

exports('getPlayerData', (key?: string) => {
  if (!key) return playerData;

  return playerMetadata[key];
});

netEvent('ox:startCharacterSelect', () => {
  for (const key in playerGroups) {
    delete playerGroups[key];
  }

  for (const key in playerMetadata) {
    delete playerMetadata[key];
  }
});

netEvent('ox:setPlayerData', (key: string, value: any) => {
  if (!playerData.charId) return;

  playerMetadata[key] = value;
  emit(`ox:player:${key}`, value);
});

netEvent('ox:setGroup', (name: string, grade: number) => {
  playerGroups[name] = grade;
});

import './death';
