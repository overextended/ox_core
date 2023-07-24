import { Ox } from "../server";

export interface PlayerLicense {
  issued: string;
}

export interface PlayerIdentifiers {
  license?: string;
  /** Preferred identifier; should always refer to Rockstar Social Club ID. */
  license2?: string;
  discord?: string;
  fivem?: string;
  steam?: string;
}

export interface IOxPlayer {
  source: number;
  userid: number;
  charid: number;
  stateid: string;
  ped: number;
  name: string;
  username: string;
  firstname: string;
  lastname: string;
}

export class OxPlayer implements IOxPlayer {
  source: number;
  userid: number;
  charid: number;
  stateid: string;
  ped: number;
  name: string;
  username: string;
  firstname: string;
  lastname: string;

  constructor(data: IOxPlayer) {
    this.source = data.source;
    this.userid = data.userid;
    this.charid = data.charid;
    this.stateid = data.stateid;
    this.ped = data.ped;
    this.name = data.name;
    this.username = data.username;
    this.firstname = data.firstname;
    this.lastname = data.lastname;
  }

  getState() {
    return Player(this.source).state;
  }

  getCoords() {
    return GetEntityCoords(this.ped);
  }

  set(key: string, value: any, replicated?: boolean) {
    Ox.CallPlayerMethod(this.source, "set", key, value, replicated);
  }

  get(key?: string): any {
    return Ox.CallPlayerMethod(this.source, "get", key);
  }

  setGroup(name: string, grade: number) {
    Ox.CallPlayerMethod(this.source, "setGroup", name, grade);
  }

  getGroup(name: string): number {
    return Ox.CallPlayerMethod(this.source, "getGroup", name);
  }

  getGroups(): Record<string, number> {
    return Ox.CallPlayerMethod(this.source, "getGroups");
  }

  hasGroup(filter: string | string[] | Record<string, number>): [string, number] | undefined {
    return Ox.CallPlayerMethod(this.source, "hasGroup", filter);
  }

  getPlayersInScope(): Record<number, true> {
    return Ox.CallPlayerMethod(this.source, "getPlayersInScope");
  }

  isPlayerInScope(target: number): boolean {
    return Ox.CallPlayerMethod(this.source, "isPlayerInScope", target);
  }

  triggerScopedEvent(eventName: string, ...args: any) {
    Ox.CallPlayerMethod(this.source, "triggerScopedEvent", eventName, ...args);
  }

  logout() {
    Ox.CallPlayerMethod(this.source, "logout");
  }

  setStatus(name: string, value: number): boolean {
    return Ox.CallPlayerMethod(this.source, "setStatus", name, value);
  }

  addStatus(name: string, value: number): boolean {
    return Ox.CallPlayerMethod(this.source, "addStatus", name, value);
  }

  removeStatus(name: string, value: number): boolean {
    return Ox.CallPlayerMethod(this.source, "removeStatus", name, value);
  }

  getLicenses(): Record<string, PlayerLicense> {
    return Ox.CallPlayerMethod(this.source, "getLicenses");
  }

  getLicense(name: string): PlayerLicense {
    return Ox.CallPlayerMethod(this.source, "getLicense", name);
  }

  addLicense(name: string): boolean {
    return Ox.CallPlayerMethod(this.source, "addLicense", name);
  }

  removeLicense(name: string): boolean {
    return Ox.CallPlayerMethod(this.source, "removeLicense", name);
  }
}

export function GetPlayer(playerId: number) {
  const player = Ox.GetPlayer(playerId);
  return player ? new OxPlayer(player) : null;
}

export function GetPlayerFromUserId(userid: number) {
  const player = Ox.GetPlayerFromUserId(userid);
  return player ? new OxPlayer(player) : null;
}

export function GetPlayerByFilter(filter: Record<string, unknown>) {
  const player = Ox.GetPlayerByFilter(filter);
  return player ? new OxPlayer(player) : null;
}

export function GetPlayers(useclass?: boolean, filter?: Record<string, unknown>) {
  const players: OxPlayer[] = Ox.GetPlayers(filter);

  if (useclass) {
    for (let i = 0; i === players.length - 1; i++) {
      players[i] = new OxPlayer(players[i]);
    }
  }

  return players;
}
