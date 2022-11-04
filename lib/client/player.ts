const exp = exports.ox_core.CPlayer;

export class CPlayer {
  coords: number[];
  groups: Record<string, number>;
  userid: number;
  charid: number;
  firstname: string;
  lastname: string;
  [key: string]: any;

  constructor(data: any) {
    this.coords = data.coords;
    this.groups = data.groups;
    this.userid = data.userid;
    this.charid = data.charid;
    this.firstname = data.firstname;
    this.lastname = data.lastname;
  }

  getPed() {
    return PlayerPedId();
  }

  getCoords(update?: boolean) {
    if (update || !this.coords) {
      this.coords = GetEntityCoords(PlayerPedId(), false);
    }

    return this.coords;
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

  get(key?: string): any {
    return exp("get", key);
  }
}

export let player: CPlayer | undefined = exports.ox_core.GetPlayerData();

function getPlayerProxy(data: CPlayer) {
  return new Proxy(new CPlayer(data), {
    get(target, key: string) {
      if (key in target || typeof key !== "string") {
        return target[key];
      }

      AddEventHandler(`ox:player:${key}`, (value: any) => {
        ///@ts-ignore-error gotta love source being defined as "number" when it's string | number
        if (GetInvokingResource() == "ox_core" && source == "") {
          target[key] = value;
        }
      });

      target[key] = exp("get", key) || false;
      return target[key];
    },
  });
}

if (player) player = getPlayerProxy(player);

const registerNetEvent = (event: string, fn: (...args: any[]) => void) => {
  onNet(event, (...args: any[]) => {
    if (source.toString() !== "") fn(...args);
  });
};

AddEventHandler("ox:playerLoaded", (data) => {
  if (!player) player = getPlayerProxy(data);
});

registerNetEvent("ox:setGroup", (name: string, grade: number) => {
  if (player) player.groups[name] = grade;
});

on("ox:playerLogout", () => {
  player = undefined;
});
