import { ClassInterface } from 'classInterface';
import {
  CreateCharacter,
  DeleteCharacter,
  GetCharacterMetadata,
  GetCharacters,
  IsStateIdAvailable,
  SaveCharacterData,
} from './db';
import { GetRandomChar, GetRandomInt } from '../../common';

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
  #statuses: Dict<any>;

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

  setGroup(groupName: string, grade?: number) {}

  getGroup(groupName: string) {}

  getGroups(filter?: string | string[] | Dict<number>) {}

  setStatus() {}

  getStatus(statusName: string) {}

  getStatuses() {}

  addStatus(statusName: string, value: number) {}

  removeStatus(statusName: string, value: number) {}

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
    if (newId) this.source = Number(newId);
    if (!OxPlayer.add(this.source, this)) return;

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
      for (let i = 0; i < 2; i++) arr[i] = GetRandomChar();
      for (let i = 2; i < 6; i++) arr[i] = GetRandomInt();

      const stateId = arr.join('');

      if (await IsStateIdAvailable(stateId)) return stateId;
    }
  }

  async createCharacter(data: NewCharacter) {
    const stateId = await this.#generateStateId();
    const phoneNumber: number = null;
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

    const { isDead, gender, dateOfBirth, phoneNumber, health, armour, statuses } = await GetCharacterMetadata(
      character.charId
    );

    character.health = isDead ? 0 : health;
    character.armour = armour;

    this.charId = character.charId;
    this.stateId = character.stateId;
    this.#metadata = {};
    this.#statuses = statuses || {};

    // setup groups
    // setup licenses
    // setup accounts

    this.emit('ox:setActiveCharacter', character, this.userId);

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
    state.set('isDead', isDead, true);

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
