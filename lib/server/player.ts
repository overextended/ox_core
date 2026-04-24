import type { OxPlayer as _OxPlayer } from 'server/player/class';
import type { Dict } from 'types';
import { GetCharacterAccount } from './account';

class PlayerInterface {
  public state: StateBagInterface;

  constructor(
    public source: number,
    public userId: number,
    public charId: number | undefined,
    public stateId: string | undefined,
    public username: string,
    public identifier: string,
    public ped: number,
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

  async getAccount() {
    return this.charId ? GetCharacterAccount(this.charId) : null;
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

export type OxPlayer = _OxPlayer & PlayerInterface;

function CreatePlayerInstance(player?: _OxPlayer) {
  if (!player) return;

  return new PlayerInterface(
    player.source as number,
    player.userId,
    player.charId,
    player.stateId,
    player.username,
    player.identifier,
    player.ped,
  ) as OxPlayer;
}

export function GetPlayer(playerId: string | number) {
  return CreatePlayerInstance(exports.ox_core.GetPlayer(playerId));
}

export function GetPlayerFromUserId(userId: number) {
  return CreatePlayerInstance(exports.ox_core.GetPlayerFromUserId(userId));
}

export function GetPlayerFromCharId(charId: number) {
  return CreatePlayerInstance(exports.ox_core.GetPlayerFromCharId(charId));
}

export function GetPlayers(filter?: Dict<any>): OxPlayer[] {
  const players = exports.ox_core.GetPlayers(filter);

  for (const id in players) players[id] = CreatePlayerInstance(players[id]);

  return players;
}

export function GetPlayerFromFilter(filter: Dict<any>) {
  return CreatePlayerInstance(exports.ox_core.GetPlayerFromFilter(filter));
}
