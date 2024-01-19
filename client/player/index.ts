import { netEvent } from 'utils';

export let PlayerIsLoaded = false;
export const PlayerState = LocalPlayer.state;
export const PlayerData: Dict<any> = {};
export const PlayerMetadata: Dict<any> = {};
export const PlayerGroups: Dict<number> = {};

export function SetPlayerLoaded(state: boolean) {
  PlayerIsLoaded = state;
}

export function SetPlayerData(userId: number, charId: number, stateId: string, groups: Record<string, number>) {
  PlayerData.userId = userId;
  PlayerData.charId = charId;
  PlayerData.stateId = stateId;

  for (const key in groups) {
    PlayerGroups[key] = groups[key];
  }

  DEV: {
    console.log(PlayerData);
    console.log(PlayerMetadata);
    console.log(PlayerGroups);
  }
}

exports('IsPlayerLoaded', () => PlayerIsLoaded);

exports('GetPlayerData', (key?: string) => {
  if (!key) return PlayerData;

  return PlayerMetadata[key];
});

netEvent('ox:startCharacterSelect', () => {
  for (const key in PlayerGroups) {
    delete PlayerGroups[key];
  }

  for (const key in PlayerMetadata) {
    delete PlayerMetadata[key];
  }
});

netEvent('ox:setPlayerData', (key: string, value: any) => {
  if (!PlayerData.charId) return;

  PlayerMetadata[key] = value;
  emit(`ox:player:${key}`, value);
});

netEvent('ox:setGroup', (name: string, grade: number) => {
  PlayerGroups[name] = grade;
});

import './spawn';
import './death';
