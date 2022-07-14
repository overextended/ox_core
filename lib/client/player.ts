export class CPlayer {
  coords: number[];
  groups: Record<string, number>;
  userid: number;
  charid: number;
  firstname: string;
  lastname: string;

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
}

export let player: CPlayer | undefined = exports.ox_core.GetPlayerData();

if (player) player = new CPlayer(player);

const registerNetEvent = (event: string, fn: (...args: any[]) => void) => {
  onNet(event, (...args: any[]) => {
    if (source.toString() !== "") fn(...args);
  });
};

registerNetEvent("ox:playerLoaded", (data) => {
  player = new CPlayer(data);
});

registerNetEvent("ox:playerLogout", () => {
  player = undefined;
});

registerNetEvent("ox:setGroup", (name: string, grade: number) => {
  if (player) player.groups[name] = grade;
});
