import { OxPlayer } from 'server/player/class';

class PlayerInterface {
  constructor(
    public source: number,
    public userId: number,
    public username: string,
    public identifier: string,
    public charId: number,
    public ped: number
  ) {
    this.source = source;
    this.userId = userId;
    this.username = username;
    this.identifier = identifier;
  }
}

Object.keys(exports.ox_core.GetPlayerCalls()).forEach((method: string) => {
  (PlayerInterface.prototype as any)[method] = function (...args: any[]) {
    return exports.ox_corse.CallPlayer(this.source, method, ...args);
  };
});

PlayerInterface.prototype.toString = function () {
  return JSON.stringify(this, null, 2);
};

export function GetPlayer(id: string | number): OxPlayer | void {
  const player = exports.ox_core.GetPlayer(id);

  if (!player) return console.error(`cannot create PlayerInterface<${id}> (invalid id)`);

  return new PlayerInterface(
    player.source,
    player.userId,
    player.username,
    player.identifier,
    player.charId,
    player.ped
  ) as OxPlayer;
}

DEV: {
  on('ox:playerLoaded', (playerId: number) => {
    const player = GetPlayer(playerId);

    if (!player) return;

    console.log(player, player.charId);
  });
}
