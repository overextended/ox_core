import { GetAccounts } from "./accounts";

const exp = exports.ox_core.CPlayer;

export class CPlayer {
  source: number;
  userid: number;
  charid: number;
  ped: number;
  name: string;
  dead: boolean;
  groups: Record<string, number>;
  coords?: number[];

  constructor(data: any) {
    this.source = data.source;
    this.userid = data.userid;
    this.charid = data.charid;
    this.ped = data.ped;
    this.name = data.name;
    this.dead = data.dead;
    this.groups = data.groups;
  }

  getCoords(update?: boolean) {
    if (update || !this.coords) this.coords = GetEntityCoords(this.ped);
    return this.coords;
  }

  set(key: string, value: any) {
    exp(this.source, "set", key, value);
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
    if (typeof filter === "string") {
      const grade = this.groups[filter];

      if (grade) return [filter, grade];
    } else if (typeof filter === "object") {
      if (Array.isArray(filter)) {
        for (let i = 0; filter.length; i++) {
          const name = filter[i];
          const playerGrade = this.groups[name];

          if (playerGrade) return [name, playerGrade];
        }
      } else {
        for (const [name, grade] of Object.entries(filter)) {
          const playerGrade = this.groups[name];

          if (playerGrade && (grade as number) <= playerGrade) {
            return [name, playerGrade];
          }
        }
      }
    }
  }

  isPlayerInScope(target: number): boolean {
    return exp(this.source, "isPlayerInScope", target);
  }

  triggerScopedEvent(eventName: string, ...args: any) {
    exp(this.source, "triggerScopedEvent", eventName, ...args);
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
