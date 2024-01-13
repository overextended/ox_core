import { cache, requestAnimDict } from '@overextended/ox_lib/client';
import { playerIsLoaded, playerState } from 'player';
import { Sleep } from '../../common';
import { DEBUG } from '../../common/config';

const hospitals = [
  [340.5, -1396.8, 32.5, 60.1],
  [-449.3, -340.2, 34.5, 76.2],
  [295.6, -583.9, 43.2, 79.5],
  [1840.1, 3670.7, 33.9, 207.6],
  [1153.2, -1526.4, 34.8, 352.4],
  [-244.7, 6328.3, 32.4, 242.1],
];

const anims = [
  ['missfinale_c1@', 'lying_dead_player0'],
  ['veh@low@front_ps@idle_duck', 'sit'],
  ['dead', 'dead_a'],
];

let playerIsDead = false;

/**
 * @todo Configs to disable builtin bleedout/respawns.
 * We still want to handle the generic death loop to prevent
 * random variables in weird death systems.
 */

async function ClearDeath(tickId: number, bleedOut: boolean) {
  const anim = cache.vehicle ? anims[1] : anims[0];
  playerState.isDead = false;
  playerIsDead = false;

  clearTick(tickId);

  if (bleedOut) {
    const coords = GetEntityCoords(cache.ped, true);
    const [x, y, z, heading] = hospitals.reduce(
      (closest, hospital) => {
        const distance = Math.sqrt(
          Math.pow(coords[0] - hospital[0], 2) +
            Math.pow(coords[1] - hospital[1], 2) +
            Math.pow(coords[2] - hospital[2], 2)
        );

        if (distance < closest.distance) return { hospital, distance };
        return closest;
      },
      { hospital: null, distance: 1000 }
    ).hospital;

    DoScreenFadeOut(500);
    RequestCollisionAtCoord(x, y, z);

    while (!IsScreenFadedOut()) await Sleep(0);

    StopAnimTask(cache.ped, anim[0], anim[1], 8.0);
    SetEntityCoordsNoOffset(cache.ped, x, y, z, false, false, false);
    SetEntityHeading(cache.ped, heading);
    SetGameplayCamRelativeHeading(0);

    await Sleep(500);

    DoScreenFadeIn(500);

    while (!IsScreenFadedIn()) await Sleep(0);
  } else {
    StopAnimTask(cache.ped, anim[0], anim[1], 8.0);
  }

  ClearPedBloodDamage(cache.ped);
  SetPlayerControl(cache.playerId, false, 0);
  SetEveryoneIgnorePlayer(cache.playerId, false);
  SetPlayerControl(cache.playerId, true, 0);
  SetPlayerInvincible(cache.playerId, false);

  for (let index = 0; index < anims.length; index++) RemoveAnimDict(anims[index][0]);
}

const bleedOutTime = DEBUG ? 100 : 1000;

async function OnPlayerDeath() {
  playerState.isDead = true;
  playerIsDead = true;

  for (let index = 0; index < anims.length; index++) await requestAnimDict(anims[index][0]);

  ShakeGameplayCam('DEATH_FAIL_IN_EFFECT_SHAKE', 1.0);
  emit('ox_inventory:disarm');

  let bleedOut = 0;
  const tickId = setTick(() => {
    const anim = cache.vehicle ? anims[1] : anims[0];

    if (!IsEntityPlayingAnim(cache.ped, anim[0], anim[1], 3))
      TaskPlayAnim(cache.ped, anim[0], anim[1], 50.0, 8.0, -1, 1, 1.0, false, false, false);

    DisableFirstPersonCamThisFrame();

    bleedOut++;

    if (bleedOut > bleedOutTime) ClearDeath(tickId, true);
  });

  const coords = GetEntityCoords(cache.ped, true);
  const health = Math.floor(Math.max(100, GetEntityMaxHealth(cache.ped) * 0.8));

  NetworkResurrectLocalPlayer(coords[0], coords[1], coords[2], GetEntityHeading(cache.ped), false, false);

  if (cache.vehicle) SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat);

  SetEntityInvincible(cache.ped, true);
  SetEntityHealth(cache.ped, health);
  SetEveryoneIgnorePlayer(cache.playerId, true);
}

setInterval(() => {
  if (!playerIsLoaded) return;

  if (!playerIsDead && IsPedDeadOrDying(cache.ped, true)) OnPlayerDeath();
}, 200);
