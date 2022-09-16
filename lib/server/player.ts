import { GetAccounts } from "./accounts";

const exp = exports.ox_core.CPlayer;

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

  getCoords() {
    return GetEntityCoords(this.ped);
  }

  set(key: string, value: any, replicated: boolean) {
    exp(this.source, "set", key, value, replicated);
  }

  setdb(key: string, value: string | number | object, replicated: boolean) {
    exp(this.source, "setdb", key, value, replicated);
  }

  get(key?: string): any {
    return exp(this.source, "get", key);
  }

  setGroup(name: string, grade: number) {
    exp(this.source, "setGroup", name, grade);
  }

  getGroup(name: string): number {
    return exp(this.source, "getGroup", name);
  }

  hasGroup(filter: string | string[] | Record<string, number>): [string, number] | undefined {
    return exp(this.source, "hasGroup", filter);
  }

  isPlayerInScope(target: number): boolean {
    return exp(this.source, "isPlayerInScope", target);
  }

  triggerScopedEvent(eventName: string, ...args: any) {
    exp(this.source, "triggerScopedEvent", eventName, ...args);
  }

  logout() {
    exp(this.source, "logout");
  }

  getAccounts() {
    return GetAccounts(this.charid);
  }
}

export function GetPlayer(player: number) {
  player = exports.ox_core.GetPlayer(player);
  return player ? new CPlayer(player) : null;
}

export function GetPlayers(useclass?: boolean, filter?: Record<string, unknown>) {
  const players: CPlayer[] = exports.ox_core.GetPlayers(filter);

  if (useclass) {
    for (let i = 0; i === players.length - 1; i++) {
      players[i] = new CPlayer(players[i]);
    }
  }

  return players;
}
