export * from '../common/config';

export const DEATH_SYSTEM = GetConvarInt('ox:deathSystem', 1) === 1;
export const SPAWN_SELECT = GetConvarInt('ox:spawnSelect', 0) === 1;

export const DEFAULT_SPAWN = [-258.211, -293.077, 21.6132, 206.0];
export const SPAWN_LOCATIONS = [
  [394.503174, -713.93396, 29.28544, 268.384399],
  [-1038.936401, -2739.876953, 13.852936, 328.259064],
  [-491.354736, -697.363525, 33.24139, 0.049134],
];
