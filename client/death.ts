import { cache, requestAnimDict, sleep } from '@overextended/ox_lib/client';
import { Vector3, Vector4 } from '@nativewrappers/fivem';
import { OxPlayer } from 'player';
import { DEATH_SYSTEM, DEBUG, HOSPITAL_BLIPS } from 'config';
import { LoadDataFile } from '../common';

const hospitals: Vector4[] = LoadDataFile('hospitals').map((vec: number[]) => {
  const hospital = Vector4.fromArray(vec);

  if (HOSPITAL_BLIPS && DEATH_SYSTEM) {
    const blip = AddBlipForCoord(hospital.x, hospital.y, hospital.z);

    SetBlipSprite(blip, 61);
    SetBlipDisplay(blip, 8);
    SetBlipScale(blip, 0.8);
    SetBlipColour(blip, 35);
    SetBlipAsShortRange(blip, true);
  }

  return hospital;
});

const anims = [
  ['missfinale_c1@', 'lying_dead_player0'],
  ['veh@low@front_ps@idle_duck', 'sit'],
  ['dead', 'dead_a'],
];

let playerIsDead = false;

async function ClearDeath(tickId: number, bleedOut: boolean) {
  const anim = cache.vehicle ? anims[1] : anims[0];

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

  emit('ox:playerRevived');
}

const bleedOutTime = DEBUG ? 100 : 1000;

async function OnPlayerDeath() {
  OxPlayer.state.set('isDead', true, true);
  emit('ox_inventory:disarm');
  emit('ox:playerDeath');

  if (!DEATH_SYSTEM) return;

  for (let index = 0; index < anims.length; index++) await requestAnimDict(anims[index][0]);

  ShakeGameplayCam('DEATH_FAIL_IN_EFFECT_SHAKE', 1.0);

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

  if (cache.vehicle) SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat as number);

  SetEntityInvincible(cache.ped, true);
  SetEntityHealth(cache.ped, health);
  SetEveryoneIgnorePlayer(cache.playerId, true);
}

AddStateBagChangeHandler('isDead', `player:${cache.serverId}`, async (_bagName: string, _key: string, value: any) => {
  playerIsDead = value;
});

function ResetDeathState() {
  OxPlayer.state.set('isDead', false, true);
}

on('ox:playerLogout', ResetDeathState);
on('ox:playerRevived', ResetDeathState);

on('ox:playerLoaded', () => {
  const id: CitizenTimer = setInterval(() => {
    if (!OxPlayer.isLoaded) return clearInterval(id);

    if (!playerIsDead && IsPedDeadOrDying(PlayerPedId(), true)) OnPlayerDeath();
  }, 200);
});
