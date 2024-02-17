import { netEvent } from 'utils';
import type { Dict, OxStatus } from 'types';

export const Statuses: Dict<OxStatus> = {};

export const OxPlayer = new (class {
  userId: number;
  charId: number;
  stateId: string;
  exports: Dict<true> = {};
  #isLoaded: boolean;
  #groups: Dict<number>;
  #statuses: Dict<number>;
  #metadata: Dict<any>;
  #state: StateBagInterface;

  constructor() {
    this.#isLoaded = false;
    this.#groups = {};
    this.#statuses = {};
    this.#metadata = {};
    this.exports = Object.entries(Object.getOwnPropertyDescriptors(this.constructor.prototype)).reduce(
      (acc: { [key: string]: true }, [name, desc]) => {
        if (name !== 'constructor' && desc.writable && typeof desc.value === 'function') acc[name] = true;

        return acc;
      },
      {}
    );

    exports(`CallPlayer`, (method: string, ...args: any[]) => {
      if (method in this.exports) return console.error(`cannot call method ${method} (method is not exported)`);
      if (method in this) return console.error(`cannot call method ${method} (method does not exist)`);

      return (this as any)[method](...args);
    });
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  set isLoaded(state: boolean) {
    this.#isLoaded = state;
  }

  get groups() {
    return this.#groups;
  }

  get statuses() {
    return this.#statuses;
  }

  get metadata() {
    return this.#metadata;
  }

  get state() {
    return this.#state;
  }

  get(key?: string) {
    if (!key) return OxPlayer;

    return OxPlayer.metadata[key];
  }

  getGroups() {
    return this.#groups;
  }

  getStatus(name: string) {
    return this.statuses[name];
  }

  setStatus(name: string, value: number) {
    if (!this.statuses[name]) return false;

    this.statuses[name] = value;
    return true;
  }

  addStatus(name: string, value: number) {
    if (!this.statuses[name]) return false;

    this.statuses[name] += value;
    return true;
  }

  removeStatus(name: string, value: number) {
    if (!this.statuses[name]) return false;

    this.statuses[name] -= value;
    return true;
  }
})();

export function SetPlayerData(userId: number, charId: number, stateId: string, groups: Record<string, number>) {
  OxPlayer.userId = userId;
  OxPlayer.charId = charId;
  OxPlayer.stateId = stateId;

  for (const key in groups) OxPlayer.groups[key] = groups[key];

  DEV: {
    console.log(OxPlayer);
    console.log(OxPlayer.metadata);
    console.log(OxPlayer.groups);
    console.log(OxPlayer.statuses);
  }
}

netEvent('ox:startCharacterSelect', () => {
  for (const key in OxPlayer.groups) delete OxPlayer.groups[key];

  for (const key in OxPlayer.metadata) {
    delete OxPlayer.metadata[key];
  }
});

netEvent('ox:setPlayerData', (key: string, value: any) => {
  if (!OxPlayer.charId) return;

  OxPlayer.metadata[key] = value;
  emit(`ox:player:${key}`, value);
});

netEvent('ox:setPlayerStatus', (key: string, value: number, set?: boolean) => {
  if (set) {
    Statuses[key] = GlobalState[`status.${key}`];
    OxPlayer.statuses[key] = value;
    return;
  }

  OxPlayer.statuses[key] += value;
});

netEvent('ox:setGroup', (name: string, grade: number) => {
  OxPlayer.groups[name] = grade;
});

import './spawn';
import './death';
import './status';
