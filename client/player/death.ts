import { cache, requestAnimDict, sleep } from '@overextended/ox_lib/client';
import { Vector3, Vector4 } from '@nativewrappers/fivem';
import { OxPlayer } from 'player';
import { DEBUG } from 'config';

const hospitals = [
  new Vector4(340.5, -1396.8, 32.5, 60.1),
  new Vector4(-449.3, -340.2, 34.5, 76.2),
  new Vector4(295.6, -583.9, 43.2, 79.5),
  new Vector4(1840.1, 3670.7, 33.9, 207.6),
  new Vector4(1153.2, -1526.4, 34.8, 352.4),
  new Vector4(-244.7, 6328.3, 32.4, 242.1),
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
  OxPlayer.state.set('isDead', false, true);
  playerIsDead = false;

  clearTick(tickId);

  if (bleedOut) {
    const coords = Vector3.fromArray(GetEntityCoords(cache.ped, true));
    let distance = 1000;
    const hospital = hospitals.reduce((closest, hospital) => {
      const hospitalDistance = coords.distance(hospital);

      if (hospitalDistance > distance) return closest;

      distance = hospitalDistance;
      return hospital;
    });

    DoScreenFadeOut(500);
    RequestCollisionAtCoord(hospital.x, hospital.y, hospital.z);

    while (!IsScreenFadedOut()) await sleep(0);

    StopAnimTask(cache.ped, anim[0], anim[1], 8.0);
    SetEntityCoordsNoOffset(cache.ped, hospital.x, hospital.y, hospital.z, false, false, false);
    SetEntityHeading(cache.ped, hospital.w);
    SetGameplayCamRelativeHeading(0);

    await sleep(500);

    DoScreenFadeIn(500);

    while (!IsScreenFadedIn()) await sleep(0);
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
  OxPlayer.state.set('isDead', true, true);
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

  NetworkResurrectLocalPlayer(coords[0], coords[1], coords[2], GetEntityHeading(cache.ped), 0, false);

  if (cache.vehicle) SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat);

  SetEntityInvincible(cache.ped, true);
  SetEntityHealth(cache.ped, health);
  SetEveryoneIgnorePlayer(cache.playerId, true);
}

on('ox:playerLoaded', () => {
  const id: CitizenTimer = setInterval(() => {
    if (!OxPlayer.isLoaded) return clearInterval(id);

    if (!playerIsDead && IsPedDeadOrDying(PlayerPedId(), true)) OnPlayerDeath();
  }, 200);
});
