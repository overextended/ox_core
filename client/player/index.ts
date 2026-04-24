import { netEvent } from 'utils';
import type { Character, Dict, OxGroup, OxStatus, PlayerMetadata } from 'types';
import { GetGroupPermissions } from '../../common';

export const Statuses: Dict<OxStatus> = {};
const callableMethods: Dict<true> = {};

class PlayerSingleton {
  userId: number;
  charId?: number;
  stateId?: string;
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
      callableMethods,
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
      }

      this.#statuses[key] = value;
    });

    netEvent('ox:setGroup', (name: string, grade: number) => {
      this.#groups[name] = grade;
    });

    exports('GetPlayer', () => this);

    exports('GetPlayerCalls', () => callableMethods);

    exports('CallPlayer', (method: string, ...args: any[]) => {
      const fn = (this as any)[method];

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

  get<K extends string>(key: K | keyof PlayerMetadata): K extends keyof PlayerMetadata ? PlayerMetadata[K] : any;
  get(key?: string) {
    if (!key) return OxPlayer;

    return this.#metadata[key];
  }

  getGroup(filter: string): number;
  getGroup(filter: string[] | Record<string, number>): [string, number] | [];
  getGroup(filter: string | string[] | Record<string, number>) {
    if (typeof filter === 'string') {
      return this.#groups[filter];
    }

    if (Array.isArray(filter)) {
      for (const name of filter) {
        const grade = this.#groups[name];
        if (grade) return [name, grade];
      }
    } else if (typeof filter === 'object') {
      for (const [name, requiredGrade] of Object.entries(filter)) {
        const grade = this.#groups[name];
        if (grade && (requiredGrade as number) <= grade) {
          return [name, grade];
        }
      }
    }
  }

  getGroupByType(type: string) {
    const groupNames: string[] = GlobalState.groups;
    const groups = groupNames.reduce((acc, groupName) => {
      const group: OxGroup = GlobalState[`group.${groupName}`];

      if (group.type === type) acc.push(groupName);

      return acc;
    }, [] as string[]);

    return this.getGroup(groups);
  }

  getGroups() {
    return this.#groups;
  }

  getStatus(name: string) {
    return this.#statuses[name];
  }

  getStatuses() {
    return this.#statuses;
  }

  setStatus(name: string, value: number) {
    if (this.#statuses[name] === undefined) return false;

    this.#statuses[name] = value < 0 ? 0 : value > 100 ? 100 : Number.parseFloat((value).toPrecision(8));
    return true;
  }

  addStatus(name: string, value: number) {
    if (this.#statuses[name] === undefined) return false;

    const newValue = this.#statuses[name] + value;
    this.#statuses[name] = newValue < 0 ? 0 : newValue > 100 ? 100 : Number.parseFloat((newValue).toPrecision(8));
    return true;
  }

  removeStatus(name: string, value: number) {
    if (this.#statuses[name] === undefined) return false;

    const newValue = this.#statuses[name] - value;
    this.#statuses[name] = newValue < 0 ? 0 : newValue > 100 ? 100 : Number.parseFloat((newValue).toPrecision(8));
    return true;
  }

  hasPermission(permission: string): boolean {
    const matchResult = permission.match(/^group\.([^.]+)\.(.*)/);
    const groupName = matchResult?.[1];
    permission = matchResult?.[2] ?? permission;

    if (groupName) {
      const grade = this.#groups[groupName];

      if (!grade) return false;

      const permissions = GetGroupPermissions(groupName);

      for (let g = grade; g > 0; g--) {
        const value = permissions[g] && permissions[g][permission];

        if (value !== undefined) return value;
      }
    }

    return false;
  }
}

export const OxPlayer = new PlayerSingleton();

import './status';
