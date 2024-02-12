import { ClassInterface } from 'classInterface';
import {
  CreateCharacter,
  DeleteCharacter,
  GetCharacterMetadata,
  GetCharacters,
  IsStateIdAvailable,
  SaveCharacterData,
} from './db';
import { getRandomChar, getRandomInt } from '@overextended/ox_lib';
import { GetGroup, OxGroup } from 'groups';
import { GeneratePhoneNumber } from 'bridge/npwd';
import { Statuses } from './status';
import { addPrincipal, removePrincipal } from '@overextended/ox_lib/server';
import { AddCharacterGroup, LoadCharacterGroups, RemoveCharacterGroup, UpdateCharacterGroup } from 'groups/db';
import { GetCharacterAccount, GetCharacterAccounts } from 'accounts';

export class OxPlayer extends ClassInterface {
  source: number | string;
  userId: number;
  charId?: number;
  stateId?: string;
  username: string;
  identifier: string;
  ped: number;
  #characters?: Character[];
  #inScope: Dict<true> = {};
  #metadata: Dict<any>;
  #statuses: Dict<number>;
  #groups: Dict<number>;

  protected static members: Dict<OxPlayer> = {};
  protected static keys: Dict<Dict<OxPlayer>> = {
    userId: {},
  };

  /** Get an instance of OxPlayer with the matching playerId. */
  static get(id: string | number) {
    return this.members[id];
  }

  /** Get an instance of OxPlayer with the matching userId. */
  static getFromUserId(id: number) {
    return this.keys.userId[id];
  }

  /** Gets all instances of OxPlayer. */
  static getAll(): Dict<OxPlayer> {
    return this.members;
  }

  constructor(source: number) {
    super();
    this.source = source;
    this.#characters = [];
    this.#inScope = {};
    this.#groups = {};
  }

  emit(eventName: string, ...args: any[]) {
    emitNet(eventName, this.source, ...args);
  }

  /** Stores a value in the active character's metadata. */
  set(key: string, value: any, replicated?: boolean) {
    this.#metadata[key] = value;

    if (replicated) emitNet('ox:setPlayerData', this.source, key, value);
  }

  /** Gets a value stored in active character's metadata. */
  get(key: string) {
    return this.#metadata[key];
  }

  getPlayersInScope() {
    return this.#inScope;
  }

  isPlayerInScope(targetId: number) {
    return targetId in this.#inScope;
  }

  triggerScopedEvent(eventName: string, ...args: any[]) {
    for (const id in this.#inScope) {
      emitNet(eventName, id, ...args);
    }
  }

  getAccount() {
    return GetCharacterAccount(this.charId);
  }

  getAccounts(includeAll?: boolean) {
    return GetCharacterAccounts(this.charId, includeAll);
  }

  async setGroup(groupName: string, grade = 0) {
    const group = GetGroup(groupName);
    const currentGrade = this.#groups[groupName];

    if (currentGrade === grade) return;

    if (!grade) {
      if (!currentGrade) return;

      if (!(await RemoveCharacterGroup(this.charId, group.name))) return;

      this.#removeGroup(group, currentGrade);
    } else {
      if (!group.grades[grade] && grade > 0)
        console.warn(`Failed to set OxPlayer<${this.userId}> ${group.name}:${grade} (invalid grade)`);

      if (currentGrade) {
        if (!(await UpdateCharacterGroup(this.charId, group.name, grade))) return;

        this.#removeGroup(group, currentGrade);
        this.#addGroup(group, grade);
      } else {
        if (!(await AddCharacterGroup(this.charId, group.name, grade))) return;

        this.#addGroup(group, grade);
      }
    }

    emit('ox:setGroup', this.source, group.name, grade ? grade : null);
    emitNet('ox:setGroup', this.source, group.name, grade ? grade : null);

    return true;
  }

  getGroup(groupName: string) {
    return this.#groups[groupName];
  }

  getGroups(filter?: string | string[] | Dict<number>) {
    return this.#groups;
  }

  setStatus(statusName: string, value = Statuses[statusName].default) {
    if (!Statuses[statusName]) return;

    if (value > 100) value = 100;
    else if (value < 0) value = 0;

    this.#statuses[statusName] = value;

    if (!source) emitNet('ox:setPlayerStatus', this.source, statusName, value, true);

    return true;
  }

  getStatus(statusName: string) {
    return this.#statuses[statusName];
  }

  getStatuses() {
    return this.#statuses;
  }

  addStatus(statusName: string, value: number) {
    if (!this.#statuses[statusName]) return;

    emitNet('ox:setPlayerStatus', this.source, statusName, +value);

    return true;
  }

  removeStatus(statusName: string, value: number) {
    if (!this.#statuses[statusName]) return;

    emitNet('ox:setPlayerStatus', this.source, statusName, -value);

    return true;
  }

  addLicense(licenseName: string) {}

  removeLicense(licenseName: string) {}

  #getSaveData() {
    const coords = GetEntityCoords(this.ped);

    return [
      coords[0],
      coords[1],
      coords[2],
      GetEntityHeading(this.ped),
      false,
      GetEntityHealth(this.ped),
      GetPedArmour(this.ped),
      JSON.stringify(this.#statuses || {}),
      this.charId,
    ];
  }

  #addGroup(group: string | OxGroup, grade: number) {
    if (typeof group === 'string') group = GetGroup(group);

    addPrincipal(this.source as string, `${group.principal}:${grade}`);
    DEV: console.info(`Added OxPlayer<${this.userId}> to group ${group.name} as grade ${grade}.`);

    this.#groups[group.name] = grade;
    GlobalState[`${group.name}:count`] += 1;
  }

  #removeGroup(group: string | OxGroup, grade: number) {
    if (typeof group === 'string') group = GetGroup(group);

    removePrincipal(this.source as string, `${group.principal}:${grade}`);
    DEV: console.info(`Removed OxPlayer<${this.userId}> from group ${group.name}.`);

    delete this.#groups[group.name];
    GlobalState[`${group.name}:count`] -= 1;
  }

  static saveAll(kickWithReason?: string) {
    const parameters = [];

    for (const id in this.members) {
      const player = this.members[id];

      if (player.charId) {
        parameters.push(player.#getSaveData());
      }

      if (kickWithReason) {
        player.charId = null;
        DropPlayer(player.source as string, kickWithReason);
      }
    }

    DEV: console.info(`Saving ${parameters.length} players to the database.`);

    if (parameters.length > 0) {
      SaveCharacterData(parameters, true);
      emit('ox:savedPlayers', parameters.length);
    }
  }

  save() {
    if (this.charId) return SaveCharacterData(this.#getSaveData());
  }

  /** Adds a player to the player registry. */
  async setAsJoined(newId?: number | string) {
    if (newId) {
      delete OxPlayer.members[this.source];
      this.source = +newId;
      OxPlayer.members[this.source] = this;
    }

    Player(this.source).state.set('userId', this.userId, true);
    emitNet('ox:startCharacterSelect', this.source, await this.#getCharacters());
  }

  async #getCharacters() {
    this.#characters = await GetCharacters(this.userId);
    return this.#characters;
  }

  async logout(dropped: boolean) {
    if (!this.charId) return;

    for (const name in this.#groups) this.#removeGroup(name, this.#groups[name]);

    emit('ox:playerLogout', this.source, this.userId, this.charId);
    await this.save();

    if (dropped) return;

    this.charId = null;

    emitNet('ox:startCharacterSelect', this.source, await this.#getCharacters());
  }

  async #generateStateId() {
    const arr = [];

    while (true) {
      for (let i = 0; i < 2; i++) arr[i] = getRandomChar();
      for (let i = 2; i < 6; i++) arr[i] = getRandomInt();

      const stateId = arr.join('');

      if (await IsStateIdAvailable(stateId)) return stateId;
    }
  }

  async createCharacter(data: NewCharacter) {
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

  #getCharacterSlotFromId(charId: number) {
    return this.#characters.findIndex((character) => {
      return character.charId === charId;
    });
  }

  async setActiveCharacter(data: number | NewCharacter) {
    if (this.charId) return;

    const character =
      this.#characters[
        typeof data === 'object' ? await this.createCharacter(data) : this.#getCharacterSlotFromId(data)
      ];

    this.#characters = null;
    this.ped = GetPlayerPed(this.source as string);

    let { isDead, gender, dateOfBirth, phoneNumber, health, armour, statuses } = await GetCharacterMetadata(
      character.charId
    );

    character.health = isDead ? 0 : health || null;
    character.armour = armour;

    this.charId = character.charId;
    this.stateId = character.stateId;
    this.#metadata = {};
    this.#statuses = {};

    const groups = await LoadCharacterGroups(this.charId);

    groups.forEach(({ name, grade }) => this.#addGroup(name, grade));

    statuses = JSON.parse(statuses as any) || this.#statuses;

    for (const name in Statuses) this.setStatus(name, statuses[name]);

    // setup licenses

    this.emit('ox:setActiveCharacter', character, this.userId, this.#groups);

    // Values stored in metadata and synced to client.
    this.set('firstName', character.firstName, true);
    this.set('lastName', character.lastName, true);
    this.set('gender', gender, true);
    this.set('dateOfBirth', dateOfBirth, true);
    this.set('phoneNumber', phoneNumber, true);

    /**
     * @todo Player metadata can ideally be handled with statebags, but requires security features.
     * Rejection of client-set values is a must-have.
     * "Private" states only visible to the owner would be :chefskiss:
     * https://github.com/citizenfx/fivem/pull/2257 - state bag filters
     * https://github.com/citizenfx/fivem/pull/2257 - state bag write policies
     */
    const state = Player(this.source).state;
    state.set('isDead', isDead ?? false, true);

    DEV: console.info(
      `OxPlayer<${this.userId}> loaded character ${this.get('firstName')} ${this.get('lastName')} (${this.charId})`
    );

    emit('ox:playerLoaded', this.source, this.userId, character.charId);

    return character;
  }

  async deleteCharacter(charId: number) {
    if (this.charId) return;

    const slot = this.#getCharacterSlotFromId(charId);

    if (slot < 0) return;

    if (await DeleteCharacter(charId)) {
      this.#characters.splice(slot, 1);
      emit('ox:deletedCharacter', this.source, this.userId, charId);

      DEV: console.info(`Deleted character ${this.charId} for OxPlayer<${this.userId}>`);
      return true;
    }
  }
}

OxPlayer.init();

exports('SaveAllPlayers', OxPlayer.saveAll);
