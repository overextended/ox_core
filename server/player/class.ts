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
import { OxGroup } from 'groups';
import { GeneratePhoneNumber } from 'bridge/npwd';
import { Statuses } from './status';
import { AddCharacterGroup, LoadCharacterGroups, RemoveCharacterGroup, UpdateCharacterGroup, UpdateService } from 'groups/db';

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
  #groups: Dict<{grade: number, inService: boolean}>;

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

  /**
   * Sets the player's group.
   * @param groupName Name of the group to set.
   * @param grade Grade to set. Set to 0 or omit to remove the group.
   * @returns True if the group was set successfully.
   */
  async setGroup(groupName: string, grade?: number) {
    if (!this.charId) return;

    if (!OxGroup.get(groupName)) return;

    const currentGroup = this.#groups[groupName];
    const currentGrade = currentGroup?.grade;

    if (currentGrade === grade) return;

    if (currentGroup) {
      if (!grade) {
        if (!(await RemoveCharacterGroup(this.charId, groupName))) return;

        this.#removeGroup(groupName, currentGrade);
      } else {
        if (!(await UpdateCharacterGroup(this.charId, groupName, grade))) return;

        this.#removeGroup(groupName, currentGrade);
        this.#addGroup(groupName, grade);
      }
    } else {
      if (!(await AddCharacterGroup(this.charId, groupName, grade))) return;

      this.#addGroup(groupName, grade);
    }

    emit('ox:setGroup', this.source, groupName, grade ? grade : null);
    emitNet('ox:setGroup', this.source, groupName, grade ? grade : null);

    return true;
  }


  /**
   * Sets the player's group service status.
   * @param groupName Name of the group to set.
   * @param inService Whether the player should get set in Service.
   * @returns True if the group service status was set successfully.
   */
  async setGroupService(groupName: string, inService: boolean) {
    if (!this.charId) return;

    if (!OxGroup.get(groupName)) return;

    const currentGroup = this.#groups[groupName];
    const currentInService = currentGroup?.inService;

    if (currentInService === inService) return;

    if (!(await UpdateService(this.charId, groupName, inService))) return;

    this.#groups[groupName].inService = inService;

    emit('ox:setGroupService', this.source, groupName, inService);
    emitNet('ox:setGroupService', this.source, groupName, inService);

    return true;
  }

  /**
   * Checks if the player has a group.
   * @param groupName 
   * @returns True if the player has the group, false otherwise.
   */
  hasGroup(groupName: string): boolean {
    return this.#groups[groupName] !== undefined;
  }

  /**
   * Checks if the player is in service for a group.
   * @param groupName 
   * @returns True if the player is in service, false otherwise.
   */  
  isInService(groupName: string): boolean {
    return this.#groups[groupName]?.inService;
  }

  #addGroup(groupName: string, grade: number) {
    this.#groups[groupName] = { grade, inService: false };

    if (grade) {
      GlobalState[`${groupName}:count`] += 1;
    }
  }

  #removeGroup(groupName: string, currentGrade: number) {
    delete this.#groups[groupName];

    if (currentGrade) {
      GlobalState[`${groupName}:count`] -= 1;
    }
  }

  async #loadGroups() {
    const rows = await LoadCharacterGroups(this.charId);

    rows.forEach(({ name, grade }) => {
      const group = this.#groups[name];

      if (group) {
        this.#addGroup(name, grade);
      }
    });
  }

  #clearGroups() {
    for (const name in this.#groups) {
      this.#removeGroup(name, this.#groups[name].grade);
      GlobalState[`${name}:count`] -= 1;
    }
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

    await this.#loadGroups()

    statuses = JSON.parse(statuses as any) || this.#statuses;

    for (const name in Statuses) this.setStatus(name, statuses[name]);

    // setup licenses
    // setup accounts

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
