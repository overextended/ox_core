import { netEvent } from 'utils';

export let playerIsLoaded = false;

export const playerState = LocalPlayer.state;

export function setPlayerLoaded(state: boolean) {
  playerIsLoaded = state;
}

export const playerData: Dict<any> = {};
export const playerMetadata: Dict<any> = {};
export const groups: Dict<number> = {};

exports('isPlayerLoaded', () => playerIsLoaded);

exports('getPlayerData', (key?: string) => {
  if (!key) return playerData;

  return playerMetadata[key];
});

netEvent('ox:startCharacterSelect', () => {
  for (const key in groups) {
    delete groups[key];
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
  groups[name] = grade;
});

import './death';
