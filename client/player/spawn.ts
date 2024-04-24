import { sleep } from '@overextended/ox_lib';
import { cache, inputDialog } from '@overextended/ox_lib/client';
import { OxPlayer } from './';
import { netEvent } from 'utils';
import { CHARACTER_SELECT, SPAWN_LOCATION } from 'config';
import locale from '../../common/locales';
import type { Character, NewCharacter } from 'types';

DoScreenFadeOut(0);
NetworkStartSoloTutorialSession();
setTimeout(() => emitNet('ox:playerJoined'));

async function StartSession() {
  if (IsPlayerSwitchInProgress()) {
    StopPlayerSwitch();
  }

  if (GetIsLoadingScreenActive()) {
    SendLoadingScreenMessage('{"fullyLoaded": true}');
    ShutdownLoadingScreenNui();
  }

  NetworkStartSoloTutorialSession();
  DoScreenFadeOut(0);
  ShutdownLoadingScreen();
  SetPlayerControl(cache.playerId, false, 0);
  SetPlayerInvincible(cache.playerId, true);

  while (!OxPlayer.isLoaded) {
    DisableAllControlActions(0);
    ThefeedHideThisFrame();
    HideHudAndRadarThisFrame();

    await sleep(0);
  }

  NetworkEndTutorialSession();
  SetPlayerControl(cache.playerId, true, 0);
  SetPlayerInvincible(cache.playerId, false);
  SetMaxWantedLevel(0);
  NetworkSetFriendlyFireOption(true);
  SetPlayerHealthRechargeMultiplier(cache.playerId, 0.0);
}

netEvent('ox:startCharacterSelect', async (_userId: number, characters: Character[]) => {
  if (OxPlayer.isLoaded) {
    OxPlayer.isLoaded = false;

    emit('ox:playerLogout');
  }

  StartSession();

  const character = characters[0];
  const [x, y, z] = [
    character?.x || SPAWN_LOCATION[0],
    character?.y || SPAWN_LOCATION[1],
    character?.z || SPAWN_LOCATION[2],
  ];
  const heading = character?.heading || 90;

  RequestCollisionAtCoord(x, y, z);
  FreezeEntityPosition(cache.ped, true);
  SetEntityCoordsNoOffset(cache.ped, x, y, z, true, true, false);
  SetEntityHeading(cache.ped, heading);

  if (!CHARACTER_SELECT) return;

  SwitchOutPlayer(cache.ped, 1, 1);

  while (GetPlayerSwitchState() !== 5) await sleep(0);

  DoScreenFadeIn(200);

  if (character) {
    return emitNet('ox:setActiveCharacter', character.charId);
  }

  const input = await inputDialog(
    locale('create_character'),
    [
      {
        type: 'input',
        required: true,
        icon: 'user-pen',
        label: locale('firstname'),
        placeholder: 'John',
      },
      {
        type: 'input',
        required: true,
        icon: 'user-pen',
        label: locale('lastname'),
        placeholder: 'Smith',
      },
      {
        type: 'select',
        required: true,
        icon: 'circle-user',
        label: locale('gender'),
        options: [
          {
            label: locale('male'),
            value: 'male',
          },
          {
            label: locale('female'),
            value: 'female',
          },
          {
            label: locale('non_binary'),
            value: 'non_binary',
          },
        ],
      },
      {
        type: 'date',
        required: true,
        icon: 'calendar-days',
        label: locale('date_of_birth'),
        format: 'YYYY-MM-DD',
        min: '1900-01-01',
        max: '2006-01-01',
        default: '2006-01-01',
      },
    ],
    {
      allowCancel: false,
    }
  );

  if (!input) return;

  emitNet('ox:setActiveCharacter', <NewCharacter>{
    firstName: input[0] as string,
    lastName: input[1] as string,
    gender: input[2] as string,
    date: input[3] as number,
  });
});

netEvent('ox:setActiveCharacter', async (character: Character) => {
  await sleep(100); //todo: solve race-condition with illenium-appearance :(

  if (CHARACTER_SELECT) {
    SwitchInPlayer(cache.ped);
    SetGameplayCamRelativeHeading(0);
  }

  while (!IsScreenFadedIn() || GetPlayerSwitchState() !== 12) await sleep(0);

  SetEntityHealth(cache.ped, character.health ?? GetEntityMaxHealth(cache.ped));
  SetPedArmour(cache.ped, character.armour ?? 0);
  FreezeEntityPosition(cache.ped, false);

  OxPlayer.isLoaded = true;

  emit('playerSpawned');
  emit('ox:playerLoaded', OxPlayer, character.isNew);
});
