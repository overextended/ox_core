import { Ox } from '../server';

export class OxPlayer {
  coords: number[];
  groups: Record<string, number>;
  userId: number;
  charId: number;
  stateId: string;
  firstName: string;
  lastName: string;
  [key: string]: any;

  constructor(data: any) {
    this.coords = data.coords;
    this.groups = data.groups;
    this.userId = data.userId;
    this.charId = data.charId;
    this.stateId = data.stateId;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
  }

  getPed() {
    return PlayerPedId();
  }

  getCoords(update?: boolean, heading?: boolean) {
    if (update || !this.coords) {
      const [x, y, z] = GetEntityCoords(this.getPed(), false);
      this.coords = heading ? [...[x, y, z], GetEntityHeading(this.getPed())] : [x, y, z];
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
    return Ox.CallPlayerMethod("get", key);
  }
}

export let player: OxPlayer | undefined = Ox.GetPlayerData();

function getPlayerProxy(data: OxPlayer) {
  return new Proxy(new OxPlayer(data), {
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

      target[key] = Ox.CallPlayerMethod("get", key) || false;
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
