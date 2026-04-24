import { cache } from '@communityox/ox_lib/client';
import type { OxPlayer } from 'client/player';
import type { Dict } from 'types';

class PlayerInterface {
  public userId: number;
  public charId?: number;
  public stateId?: string;
  [key: string]: any;

  constructor() {
    try {
      const { userId, charId, stateId } = exports.ox_core.GetPlayer();
      this.userId = userId;
      this.charId = charId;
      this.stateId = stateId;
    } catch (e) {}

    this.state = LocalPlayer.state;

    this.constructor.prototype.toString = () => {
      return JSON.stringify(this, null, 2);
    };

    const getMethods = async () => {
      Object.keys(exports.ox_core.GetPlayerCalls()).forEach((method: string) => {
        if (!this.constructor.prototype[method])
          this.constructor.prototype[method] = (...args: any[]) => exports.ox_core.CallPlayer(method, ...args);
      });
    };

    // Prevent errors if resource starts before ox_core (generally during development)
    getMethods().catch(() => setImmediate(getMethods));
  }

  /**
   * Registers an event handler which will be triggered when the specified player data is updated.
   */
  on(key: string, callback: (data: unknown) => void) {
    this.get(key);

    on(`ox:player:${key}`, (data: unknown) => {
      if (GetInvokingResource() == 'ox_core' && (source as any) === '') callback(data);
    });
  }

  /**
   * Returns player data for the specified key. The data is cached and kept updated for future calls.
   */
  get(key: string) {
    if (!this.charId) return;

    if (!(key in this)) {
      this[key] = exports.ox_core.CallPlayer('get', key) ?? null;
      this.on(key, (data: unknown) => (this[key] = data));
    }

    return this[key];
  }

  getCoords() {
    return GetEntityCoords(cache.ped);
  }
}

export type OxPlayer = typeof OxPlayer & PlayerInterface;

const player = new PlayerInterface() as OxPlayer;

export function GetPlayer() {
  return player;
}

on('ox:playerLoaded', (data: Dict<any>) => {
  if (player.charId) return;

  for (const key in data) player[key] = data[key];
});

on('ox:playerLogout', () => {
  for (const key in player) delete player[key];
});
