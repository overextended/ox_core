import { cache } from '@overextended/ox_lib/client';
import type { OxPlayer } from 'client/player';
import type { Dict } from 'types';

let groups: Dict<number>;

class PlayerInterface {
  [key: string]: any;

  constructor(
    public userId: number,
    public charId?: number,
    public stateId?: string
  ) {
    this.userId = userId;
    this.charId = charId;
    this.stateId = stateId;

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

  get(key: string) {
    if (!this.charId) return;

    if (!(key in this)) {
      console.log(`make handler ox:player:${key}`);

      on(`ox:player:${key}`, (data: any) => {
        console.log(`trigger handler ox:player:${key}`);

        if (GetInvokingResource() == 'ox_core' && (source as any) === '') this[key] = data;
      });

      this[key] = exports.ox_core.CallPlayer('get', key) || null;
    }

    return this[key];
  }

  getCoords() {
    return GetEntityCoords(cache.ped);
  }

  getState() {
    return LocalPlayer.state;
  }

  getGroup(filter: string | string[] | Record<string, number>) {
    if (typeof filter === 'string') {
      const grade = groups[filter];

      if (grade) return grade;
    } else if (typeof filter === 'object') {
      if (Array.isArray(filter)) {
        for (let i = 0; filter.length; i++) {
          const name = filter[i];
          const playerGrade = groups[name];

          if (playerGrade) return [name, playerGrade];
        }
      } else {
        for (const [name, grade] of Object.entries(filter)) {
          const playerGrade = groups[name];

          if (playerGrade && (grade as number) <= playerGrade) {
            return [name, playerGrade];
          }
        }
      }
    }
  }

  getGroups() {
    return groups;
  }
}

const { userId, charId, stateId } = ((): { userId: number; charId?: number; stateId?: string } => {
  try {
    return exports.ox_core.GetPlayer();
  } catch (e) {
    return {} as any;
  }
})();

const player = new PlayerInterface(userId, charId, stateId) as typeof OxPlayer & PlayerInterface;
groups = player.charId ? exports.ox_core.CallPlayer('getGroups') : {};

export function GetPlayer() {
  return player;
}

on('ox:playerLoaded', (data: Dict<any>) => {
  if (player.charId) return;

  groups = exports.ox_core.CallPlayer('getGroups') || {};
  for (const key in data) player[key] = data[key];
});

on('ox:playerLogout', () => {
  for (const key in player) delete player[key];
});

onNet('ox:setGroup', (name: string, grade: number) => {
  if ((source as any) === '') return;

  groups[name] = grade;
});
