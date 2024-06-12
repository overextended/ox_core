import type { OxPlayer } from 'server/player/class';
import type { Dict } from 'types';

class PlayerInterface {
  public state: StateBagInterface;

  constructor(
    public source: number,
    public userId: number,
    public charId: number | undefined,
    public stateId: string | undefined,
    public username: string,
    public identifier: string,
    public ped: number
  ) {
    this.source = source;
    this.userId = userId;
    this.charId = charId;
    this.stateId = stateId;
    this.username = username;
    this.identifier = identifier;
    this.ped = ped;
  }

  getCoords() {
    return GetEntityCoords(this.ped);
  }

  getState() {
    return Player(source).state;
  }
}

Object.keys(exports.ox_core.GetPlayerCalls()).forEach((method: string) => {
  (PlayerInterface.prototype as any)[method] = function (...args: any[]) {
    return exports.ox_core.CallPlayer(this.source, method, ...args);
  };
});

PlayerInterface.prototype.toString = function () {
  return JSON.stringify(this, null, 2);
};

export type OxPlayerServer = InstanceType<typeof OxPlayer> & InstanceType<typeof PlayerInterface>;

function CreatePlayerInstance(player?: InstanceType<typeof OxPlayer>) {
  if (!player) return;

  return new PlayerInterface(
    player.source as number,
    player.userId,
    player.charId,
    player.stateId,
    player.username,
    player.identifier,
    player.ped
  ) as OxPlayerServer;
}

export function GetPlayer(playerId: string | number) {
  return CreatePlayerInstance(exports.ox_core.GetPlayer(playerId));
}

export function GetPlayerFromUserId(userId: number) {
  return CreatePlayerInstance(exports.ox_core.GetPlayerFromUserId(userId));
}

export function GetPlayers(filter?: Dict<any>): OxPlayerServer[] {
  const players = exports.ox_core.GetPlayers(filter);

  for (const id in players) players[id] = CreatePlayerInstance(players[id]);

  return players;
}

export function GetPlayerFromFilter(filter: Dict<any>) {
  return CreatePlayerInstance(exports.ox_core.GetPlayerFromFilter(filter));
}
