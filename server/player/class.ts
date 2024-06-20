import { ClassInterface } from 'classInterface';
import {
  AddCharacterLicense,
  CreateCharacter,
  DeleteCharacter,
  GetCharacterLicenses,
  GetCharacterMetadata,
  GetCharacters,
  IsStateIdAvailable,
  RemoveCharacterLicense,
  SaveCharacterData,
  UpdateCharacterLicense,
} from './db';
import { getRandomChar, getRandomInt } from '@overextended/ox_lib';
import { GetGroup, GetGroupsByType } from 'groups';
import { GeneratePhoneNumber } from 'bridge/npwd';
import { Statuses } from './status';
import { addPrincipal, removePrincipal } from '@overextended/ox_lib/server';
import {
  AddCharacterGroup,
  GetCharacterGroups,
  RemoveCharacterGroup,
  UpdateCharacterGroup,
  SetActiveGroup,
} from 'groups/db';
import { GetCharacterAccount, GetCharacterAccounts } from 'accounts';
import type { Character, Dict, NewCharacter, PlayerMetadata, OxGroup, CharacterLicense } from 'types';
import { GetGroupPermissions } from '../../common';

export type PlayerInstance = InstanceType<typeof OxPlayer>;

export class OxPlayer extends ClassInterface {
  source: number | string;
  userId: number;
  charId?: number;
  stateId?: string;
  username: string;
  identifier: string;
  ped: number;
  #characters: Character[];
  #inScope: Dict<true> = {};
  #metadata: Dict<any>;
  #statuses: Dict<number>;
  #groups: Dict<number>;
  #licenses: Dict<CharacterLicense>;

  protected static members: Dict<PlayerInstance> = {};
  protected static keys: Dict<Dict<PlayerInstance>> = {
    userId: {},
    charId: {},
  };

  /** Get an instance of OxPlayer with the matching playerId. */
  static get(id: string | number) {
    return this.members[id];
  }

  /** Get an instance of OxPlayer with the matching userId. */
  static getFromUserId(id: number) {
    return this.keys.userId[id];
  }

  /** Compares player fields and metadata to a filter, returning the player if all values match. */
  private filter(criteria: Dict<any>) {
    const { groups, ...filter } = criteria;

    if (groups && !this.getGroup(groups)) return;

    for (const key in filter) {
      const value = filter[key];

      if (this[key as keyof OxPlayer] !== value && this.#metadata[key] !== value) return;
    }

    return this;
  }

  /** Get an instance of OxPlayer with that matches the filter. */
  static getFromFilter(filter: Dict<any>) {
    for (const id in this.members) {
      const player = this.members[id].filter(filter);
      if (player) return player;
    }
  }

  /** Gets all instances of OxPlayer, optionally comparing against a filter. */
  static getAll(filter?: Dict<any>, asArray?: false): Dict<PlayerInstance>;
  static getAll(filter?: Dict<any>, asArray?: true): PlayerInstance[];
  static getAll(filter?: Dict<any>, asArray = false): Dict<PlayerInstance> | PlayerInstance[] {
    if (!filter) return asArray ? Object.values(this.members) : this.members;

    const obj: Dict<PlayerInstance> = {};

    for (const id in this.members) {
      const player = this.members[id].filter(filter);
      if (player) obj[id] = player;
    }

    return asArray ? Object.values(obj) : obj;
  }

  /** Saves all players to the database, and optionally kicks them from the server. */
  static saveAll(kickWithReason?: string) {
    const parameters = [];

    for (const id in this.members) {
      const player = this.members[id];

      if (player.charId) {
        parameters.push(player.#getSaveData());
      }

      if (kickWithReason) {
        delete player.charId;
        DropPlayer(player.source as string, kickWithReason);
      }
    }

    DEV: console.info(`Saving ${parameters.length} players to the database.`);

    if (parameters.length > 0) {
      SaveCharacterData(parameters, true);
      emit('ox:savedPlayers', parameters.length);
    }
  }

  constructor(source: number) {
    super();
    this.source = source;
    this.#characters = [];
    this.#inScope = {};
    this.#metadata = {};
    this.#statuses = {};
    this.#groups = {};
    this.#licenses = {};
  }

  /** Triggers an event on the player's client. */
  emit(eventName: string, ...args: any[]) {
    emitNet(eventName, this.source, ...args);
  }

  /** Stores a value in the active character's metadata. */
  set<K extends string>(
    key: K | keyof PlayerMetadata,
    value: K extends keyof PlayerMetadata ? PlayerMetadata[K] : any,
    replicated?: boolean
  ): void;
  set(key: string, value: any, replicated?: boolean) {
    this.#metadata[key] = value;

    if (replicated) this.emit('ox:setPlayerData', key, value);
  }

  /** Gets a value stored in active character's metadata. */
  get<K extends string>(key: K | keyof PlayerMetadata): K extends keyof PlayerMetadata ? PlayerMetadata[K] : any {
    return this.#metadata[key];
  }

  /** Returns an object of all player id's in range of the player. */
  getPlayersInScope() {
    return this.#inScope;
  }

  /** Returns true if the target player id is in range of the player. */
  isPlayerInScope(targetId: number) {
    return targetId in this.#inScope;
  }

  /** Triggers an event on all players within range of the player. */
  triggerScopedEvent(eventName: string, ...args: any[]) {
    for (const id in this.#inScope) {
      emitNet(eventName, id, ...args);
    }
  }

  /** Returns the default account for the active character. */
  getAccount() {
    if (!this.charId) return;
    return GetCharacterAccount(this.charId);
  }

  /** Returns all accounts for the active character. Passing `true` will include accounts the character has access to. */
  getAccounts(getShared?: boolean) {
    if (!this.charId) return;
    return GetCharacterAccounts(this.charId, getShared);
  }

  setActiveGroup(groupName?: string, temp?: boolean) {
    if (!this.charId || (groupName && !(groupName in this.#groups))) return false;

    SetActiveGroup(this.charId, temp ? undefined : groupName);

    this.set('activeGroup', groupName, true);
    emit('ox:setActiveGroup', this.source, groupName);

    return true;
  }

  /** Sets the active character's grade in a group. If the grade is 0 they will be removed from the group. */
  async setGroup(groupName: string, grade = 0) {
    if (!this.charId) return false;

    const group = GetGroup(groupName);

    if (!group) return console.warn(`Failed to set OxPlayer<${this.userId}> ${groupName}:${grade} (invalid group)`);

    const currentGrade = this.#groups[groupName];

    if (currentGrade === grade) return;

    if (!grade) {
      if (!currentGrade) return;
      if (!(await RemoveCharacterGroup(this.charId, group.name))) return;
      if (this.get('activeGroup') === groupName) this.set('activeGroup', undefined, true);

      this.#removeGroup(group, currentGrade);
    } else {
      if (!group.grades[grade] && grade > 0)
        return console.warn(`Failed to set OxPlayer<${this.userId}> ${group.name}:${grade} (invalid grade)`);

      if (currentGrade) {
        if (!(await UpdateCharacterGroup(this.charId, group.name, grade))) return;

        this.#removeGroup(group, currentGrade);
        this.#addGroup(group, grade);
      } else {
        const relatedGroups = group.type && GetGroupsByType(group.type);

        if (
          relatedGroups &&
          relatedGroups.some((name) => {
            return name in this.#groups;
          })
        )
          return console.warn(
            `Failed to set OxPlayer<${this.userId}> ${group.name}:${grade} (already has group of type '${group.type}')`
          );

        if (!(await AddCharacterGroup(this.charId, group.name, grade))) return;

        this.#addGroup(group, grade);
      }
    }

    emit('ox:setGroup', this.source, group.name, grade ? grade : null);
    this.emit('ox:setGroup', group.name, grade ? grade : null);

    return true;
  }

  /** Returns the current grade of a given group name, or the first matched name and grade in the filter. */
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
    return this.getGroup(GetGroupsByType(type));
  }

  getGroups() {
    return this.#groups;
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

  /** Sets the value of a status. */
  setStatus(statusName: string, value = Statuses[statusName].default) {
    if (Statuses[statusName] === undefined) return;

    if (value > 100) value = 100;
    else if (value < 0) value = 0;

    this.#statuses[statusName] = value;

    if (!source) this.emit('ox:setPlayerStatus', statusName, value, true);

    return true;
  }

  /** Returns the current value of a status. */
  getStatus(statusName: string) {
    return this.#statuses[statusName];
  }

  /** Returns an object containing all status names and their values. */
  getStatuses() {
    return this.#statuses;
  }

  /** Increases the status's value by the given amount. */
  addStatus(statusName: string, value: number) {
    if (this.#statuses[statusName] === undefined) return;

    this.emit('ox:setPlayerStatus', statusName, +value);

    return true;
  }

  /** Reduces the status's value by the given amount. */
  removeStatus(statusName: string, value: number) {
    if (this.#statuses[statusName] === undefined) return;

    this.emit('ox:setPlayerStatus', statusName, -value);

    return true;
  }

  getLicense(licenseName: string) {
    return this.#licenses[licenseName];
  }

  getLicenses() {
    return this.#licenses;
  }

  async addLicense(licenseName: string) {
    if (!this.charId || this.#licenses[licenseName]) return false;

    const issued = Date.now();

    const license = {
      issued,
    };

    if (!(await AddCharacterLicense(this.charId, licenseName, license))) return false;

    this.#licenses[licenseName] = license;

    emit('ox:licenseAdded', this.source, licenseName);
    this.emit('ox:licenseAdded', licenseName);

    return true;
  }

  async removeLicense(licenseName: string) {
    if (!this.charId || !(await RemoveCharacterLicense(this.charId, licenseName))) return false;

    delete this.#licenses[licenseName];

    emit('ox:licenseRemoved', this.source, licenseName);
    this.emit('ox:licenseRemoved', licenseName);

    return true;
  }

  async updateLicense(licenseName: string, key: string, value: any) {
    if (!this.charId) return false;

    const license = this.#licenses[licenseName];

    if (!license || key === 'issued') return false;

    if (!(await UpdateCharacterLicense(this.charId, licenseName, key, value))) return false;

    value == null ? delete license[key] : (license[key] = value);

    return true;
  }

  /** Returns an array of values to be saved in the database. */
  #getSaveData() {
    return [
      ...GetEntityCoords(this.ped),
      GetEntityHeading(this.ped),
      Player(this.source).state.isDead || false,
      GetEntityHealth(this.ped),
      GetPedArmour(this.ped),
      JSON.stringify(this.#statuses || {}),
      this.charId,
    ];
  }

  /** Adds the active character to the group and sets permissions. */
  #addGroup(group: string | OxGroup, grade: number) {
    if (typeof group === 'string') group = GetGroup(group);

    addPrincipal(this.source as string, `${group.principal}:${grade}`);
    DEV: console.info(`Added OxPlayer<${this.userId}> to group '${group.name}' as grade ${grade}.`);

    this.#groups[group.name] = grade;
    GlobalState[`${group.name}:count`] += 1;
  }

  /** Removes the active character from the group and sets permissions. */
  #removeGroup(group: string | OxGroup, grade: number) {
    if (typeof group === 'string') group = GetGroup(group);

    removePrincipal(this.source as string, `${group.principal}:${grade}`);
    DEV: console.info(`Removed OxPlayer<${this.userId}> from group '${group.name}'.`);

    delete this.#groups[group.name];
    GlobalState[`${group.name}:count`] -= 1;
  }

  /** Saves the active character to the database. */
  save() {
    if (this.charId) return SaveCharacterData(this.#getSaveData());
  }

  /** Adds the player to the player registry and starts character selection. */
  async setAsJoined() {
    if (!OxPlayer.getFromUserId(this.userId)) {
      OxPlayer.add(this.source, this);
      Player(this.source).state.set('userId', this.userId, true);
    }

    DEV: console.info(`Starting character selection for OxPlayer<${this.userId}>`);

    this.emit('ox:startCharacterSelect', this.userId, await this.#getCharacters());
  }

  /** Returns an array of all characters owned by the player, excluding soft-deleted characters. */
  async #getCharacters() {
    this.#characters = await GetCharacters(this.userId);
    return this.#characters;
  }

  /**
   * Clears data for the active character. If the player is still connected then transition them to character selection.
   * @param dropped If the player has been dropped from the server.
   * @param save If character data should be saved to the database (defaults to true).
   */
  async logout(save: boolean = true, dropped = false) {
    if (!this.charId) return;

    for (const name in this.#groups) this.#removeGroup(name, this.#groups[name]);

    emit('ox:playerLogout', this.source, this.userId, this.charId);

    if (save) await this.save();

    if (dropped) return;

    delete this.charId;

    this.emit('ox:startCharacterSelect', this.userId, await this.#getCharacters());
  }

  /** Creates a stateId for a newly created character. */
  async #generateStateId() {
    const arr = [];

    while (true) {
      for (let i = 0; i < 2; i++) arr[i] = getRandomChar();
      for (let i = 2; i < 6; i++) arr[i] = getRandomInt();

      const stateId = arr.join('');

      if (await IsStateIdAvailable(stateId)) return stateId;
    }
  }

  /** Registers a new character for the player. */
  async createCharacter(data: NewCharacter) {
    if (this.charId) return;

    const stateId = await this.#generateStateId();
    const phoneNumber = await GeneratePhoneNumber();

    const character: Character = {
      firstName: data.firstName,
      lastName: data.lastName,
      stateId: stateId,
      charId: await CreateCharacter(
        this.userId,
        stateId,
        data.firstName,
        data.lastName,
        data.gender,
        data.date,
        phoneNumber
      ),
      isNew: true,
    };

    this.#characters.push(character);
    emit('ox:createdCharacter', this.source, this.userId, character.charId);

    return this.#characters.length - 1;
  }

  /** Returns the current index for a character with the given charId. */
  #getCharacterSlotFromId(charId: number) {
    if (this.charId) return -1;

    return this.#characters.findIndex((character) => {
      return character.charId === charId;
    });
  }

  /** Loads and sets the player's active character. */
  async setActiveCharacter(data: number | NewCharacter) {
    if (this.charId) return;

    const characterSlot =
      typeof data === 'object' ? await this.createCharacter(data) : this.#getCharacterSlotFromId(data);

    if (characterSlot == null) return;

    const character = this.#characters[characterSlot];

    this.#characters.length = 0;
    this.charId = character.charId;
    this.stateId = character.stateId;
    this.ped = GetPlayerPed(this.source as string);

    const metadata = await GetCharacterMetadata(character.charId);

    if (!metadata) return;

    const statuses = JSON.parse(metadata.statuses as any) || this.#statuses;
    const { isDead, gender, dateOfBirth, phoneNumber, health, armour } = metadata;
    const groups = await GetCharacterGroups(this.charId);
    const licenses = await GetCharacterLicenses(this.charId);

    character.health = isDead ? 0 : health;
    character.armour = armour;

    groups.forEach(({ name, grade }) => this.#addGroup(name, grade));

    licenses.forEach(({ name, data }) => (this.#licenses[name] = JSON.parse(data as string)));

    for (const name in Statuses) this.setStatus(name, statuses[name]);

    this.emit('ox:setActiveCharacter', character, this.#groups);

    // Values stored in metadata and synced to client.
    this.set('name', `${character.firstName} ${character.lastName}`, true);
    this.set('firstName', character.firstName, true);
    this.set('lastName', character.lastName, true);
    this.set('gender', gender, true);
    this.set('dateOfBirth', dateOfBirth, true);
    this.set('phoneNumber', phoneNumber, true);
    this.set('activeGroup', groups.find((group) => group.isActive)?.name, true);

    /**
     * @todo Player metadata can ideally be handled with statebags, but requires security features.
     * Rejection of client-set values is a must-have.
     * "Private" states only visible to the owner would be :chefskiss:
     * https://github.com/citizenfx/fivem/pull/2257 - state bag filters
     * https://github.com/citizenfx/fivem/pull/2257 - state bag write policies
     */
    const state = Player(this.source).state;
    state.set('isDead', isDead === 1, true);

    DEV: console.info(`OxPlayer<${this.userId}> loaded character ${this.get('name')} (${this.charId})`);

    emit('ox:playerLoaded', this.source, this.userId, character.charId);

    return character;
  }

  /** Deletes a character with the given charId if it's owned by the player. */
  async deleteCharacter(charId: number) {
    const isActive = this.charId === charId;

    if (this.charId && !isActive) return;

    const characterSlot = isActive ? 0 : this.#getCharacterSlotFromId(charId);

    if (characterSlot === -1) return;

    if (await DeleteCharacter(charId)) {
      if (isActive) this.logout(false);
      else this.#characters.splice(characterSlot, 1);

      emit('ox:deletedCharacter', this.source, this.userId, charId);

      DEV: console.info(`Deleted character ${this.charId} for OxPlayer<${this.userId}>`);
      return true;
    }
  }
}

OxPlayer.init();

exports('SaveAllPlayers', (arg: any) => OxPlayer.saveAll(arg));
exports('GetPlayerFromUserId', (arg: any) => OxPlayer.getFromUserId(arg));
exports('GetPlayerFromFilter', (arg: any) => OxPlayer.getFromFilter(arg));
exports(`GetPlayers`, (arg: any) => OxPlayer.getAll(arg, true));
