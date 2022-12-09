const Ox = exports.ox_core;

type PlayerLicense = { issued: string };

export class CPlayer {
  source: number;
  userid: number;
  charid: number;
  ped: number;
  name: string;
  username: string;
  firstname: string;
  lastname: string;

  constructor(data: any) {
    this.source = data.source;
    this.userid = data.userid;
    this.charid = data.charid;
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
    Ox.CPlayer(this.source, "set", key, value, replicated);
  }

  get(key?: string): any {
    return Ox.CPlayer(this.source, "get", key);
  }

  setGroup(name: string, grade: number) {
    Ox.CPlayer(this.source, "setGroup", name, grade);
  }

  getGroup(name: string): number {
    return Ox.CPlayer(this.source, "getGroup", name);
  }

  getGroups(): Record<string, number> {
    return Ox.CPlayer(this.source, "getGroups");
  }

  hasGroup(filter: string | string[] | Record<string, number>): [string, number] | undefined {
    return Ox.CPlayer(this.source, "hasGroup", filter);
  }

  getPlayersInScope(): Record<number, true> {
    return Ox.CPlayer(this.source, "getPlayersInScope");
  }

  isPlayerInScope(target: number): boolean {
    return Ox.CPlayer(this.source, "isPlayerInScope", target);
  }

  triggerScopedEvent(eventName: string, ...args: any) {
    Ox.CPlayer(this.source, "triggerScopedEvent", eventName, ...args);
  }

  logout() {
    Ox.CPlayer(this.source, "logout");
  }

  setStatus(name: string, value: number): boolean {
    return Ox.CPlayer(this.source, "setStatus", name, value);
  }

  addStatus(name: string, value: number): boolean {
    return Ox.CPlayer(this.source, "addStatus", name, value);
  }

  removeStatus(name: string, value: number): boolean {
    return Ox.CPlayer(this.source, "removeStatus", name, value);
  }

  getLicenses(): Record<string, PlayerLicense> {
    return Ox.CPlayer(this.source, "getLicenses");
  }

  getLicense(name: string): PlayerLicense {
    return Ox.CPlayer(this.source, "getLicense", name);
  }

  addLicense(name: string): boolean {
    return Ox.CPlayer(this.source, "addLicense", name);
  }

  removeLicense(name: string): boolean {
    return Ox.CPlayer(this.source, "removeLicense", name);
  }
}

export function GetPlayer(playerId: number) {
  const player = Ox.GetPlayer(playerId);
  return player ? new CPlayer(player) : null;
}

export function GetPlayerFromUserId(userid: number) {
  const player = Ox.GetPlayerFromUserId(userid);
  return player ? new CPlayer(player) : null;
}

export function GetPlayerByFilter(filter: Record<string, unknown>) {
  const player = Ox.GetPlayerByFilter(filter);
  return player ? new CPlayer(player) : null;
}

export function GetPlayers(useclass?: boolean, filter?: Record<string, unknown>) {
  const players: CPlayer[] = Ox.GetPlayers(filter);

  if (useclass) {
    for (let i = 0; i === players.length - 1; i++) {
      players[i] = new CPlayer(players[i]);
    }
  }

  return players;
}
