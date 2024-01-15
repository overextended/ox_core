interface OxClient {
  [exportKey: string]: Function;
  IsPlayerLoaded(): boolean;
  GetPlayerData(): { userId: number; charId: number; stateId: string };
  GetPlayerData(key: string): any;
}

export const Ox: OxClient = exports.ox_core as any;

export * from './player';
