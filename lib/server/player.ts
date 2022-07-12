const exp = exports.ox_core.CPlayer;

interface ICPlayer {
  source: number;
  userid: number;
  charid: number;
  ped: number;
  name: string;
  dead: boolean;
  groups: Record<string, number>;
}

export class CPlayer implements ICPlayer {
  source: number;
  userid: number;
  charid: number;
  ped: number;
  name: string;
  dead: boolean;
  groups: Record<string, number>;

  coords?: number[];

  constructor(data: ICPlayer) {
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

  set(index: string, value: any) {
    exp(this.source, "set", index, value);
  }

  get(index?: string): any {
    return exp(this.source, "get", index);
  }

  setGroup(name: string, grade: number) {
    exp(this.source, "setGroup", name, grade);
  }

  getGroup(name: string): number {
    return exp(this.source, "getGroup", name);
  }

  // TODO: unanyfy
  hasGroup(filter: any): [string, number] | undefined {
    const type = typeof filter;

    if (type === "string") {
      const grade = this.groups[filter];

      if (grade) return [filter, grade];
    } else if (type === "object") {
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
}

export function GetPlayer(player: number | ICPlayer) {
  player = typeof player === "object" && player.source ? player : (exports.ox_core.GetPlayer(player) as ICPlayer);
  return new CPlayer(player);
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
