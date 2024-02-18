import { netEvent } from 'utils';
import type { Character, Dict, OxStatus } from 'types';

export const Statuses: Dict<OxStatus> = {};
const callableMethods: Dict<true> = {};

export const OxPlayer = new (class PlayerSingleton {
  userId: number;
  charId: number;
  stateId: string;
  [key: string]: any;
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
    this.#state = LocalPlayer.state;

    Object.entries(Object.getOwnPropertyDescriptors(this.constructor.prototype)).reduce(
      (methods: { [key: string]: true }, [name, desc]) => {
        if (name !== 'constructor' && desc.writable && typeof desc.value === 'function') methods[name] = true;

        return methods;
      },
      callableMethods
    );

    netEvent('ox:startCharacterSelect', (userId: number) => {
      this.userId = userId;

      for (const key in this.#groups) delete this.#groups[key];

      for (const key in this.#metadata) delete this.#metadata[key];
    });

    netEvent('ox:setActiveCharacter', async (character: Character, groups: Record<string, number>) => {
      OxPlayer.charId = character.charId;
      OxPlayer.stateId = character.stateId;

      for (const key in groups) this.#groups[key] = groups[key];

      DEV: {
        console.log(this);
        console.log(this.#groups);
        console.log(this.#statuses);
      }
    });

    netEvent('ox:setPlayerData', (key: string, value: any) => {
      if (!this.charId) return;

      this.#metadata[key] = value;
      emit(`ox:player:${key}`, value);
    });

    netEvent('ox:setPlayerStatus', (key: string, value: number, set?: boolean) => {
      if (set) {
        Statuses[key] = GlobalState[`status.${key}`];
        this.#statuses[key] = value;
        return;
      }

      this.#statuses[key] += value;
    });

    netEvent('ox:setGroup', (name: string, grade: number) => {
      this.#groups[name] = grade;
    });

    exports(`GetPlayer`, () => this);

    exports(`GetPlayerCalls`, () => callableMethods);

    exports(`CallPlayer`, (method: string, ...args: any[]) => {
      const fn = this[method];

      if (!fn) return console.error(`cannot call method ${method} (method does not exist)`);

      if (!callableMethods[method]) return console.error(`cannot call method ${method} (method is not exported)`);

      return fn.bind(this)(...args); // why :\
    });
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  set isLoaded(state: boolean) {
    this.#isLoaded = state;
  }

  get state() {
    return this.#state;
  }

  get(key?: string) {
    if (!key) return OxPlayer;

    return this.#metadata[key];
  }

  getGroups() {
    return this.#groups;
  }

  getStatus(name: string) {
    return this.#statuses[name];
  }

  setStatus(name: string, value: number) {
    if (!this.#statuses[name]) return false;

    this.#statuses[name] = value;
    return true;
  }

  addStatus(name: string, value: number) {
    if (!this.#statuses[name]) return false;

    this.#statuses[name] += value;
    return true;
  }

  removeStatus(name: string, value: number) {
    if (!this.#statuses[name]) return false;

    this.#statuses[name] -= value;
    return true;
  }
})();

import './spawn';
import './death';
import './status';
