import { CHARACTER_SLOTS, DEFAULT_SPAWN } from 'config';
import { sleep } from '@overextended/ox_lib';
import {
  alertDialog,
  inputDialog,
  registerContext,
  showContext,
  triggerServerCallback,
  cache,
} from '@overextended/ox_lib/client';
import { PlayerIsLoaded, PlayerData, SetPlayerLoaded, SetPlayerData } from './';
import { netEvent } from 'utils';
import locale from '../../locales';

let playerIsHidden = true;
let camActive = false;

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

  while (!PlayerIsLoaded || playerIsHidden) {
    DisableAllControlActions(0);
    ThefeedHideThisFrame();
    HideHudAndRadarThisFrame();

    if (playerIsHidden) SetLocalPlayerInvisibleLocally(true);

    await sleep(0);
  }

  NetworkEndTutorialSession();
  SetPlayerControl(cache.playerId, true, 0);
  SetPlayerInvincible(cache.playerId, false);
  SetMaxWantedLevel(0);
  NetworkSetFriendlyFireOption(true);
  SetPlayerHealthRechargeMultiplier(cache.playerId, 0.0);
}

emitNet('ox:playerJoined');
setImmediate(StartSession);

async function StartCharacterSelect() {
  while (!IsScreenFadedOut()) {
    DoScreenFadeOut(0);
    await sleep(0);
  }

  SetEntityCoordsNoOffset(cache.ped, DEFAULT_SPAWN[0], DEFAULT_SPAWN[1], DEFAULT_SPAWN[2], true, true, false);
  StartPlayerTeleport(
    cache.playerId,
    DEFAULT_SPAWN[0],
    DEFAULT_SPAWN[1],
    DEFAULT_SPAWN[2],
    DEFAULT_SPAWN[3],
    false,
    true,
    false
  );

  while (!UpdatePlayerTeleport(cache.playerId)) await sleep(0);

  camActive = true;
  const camOffset = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 4.7, 0.2);
  const cam = CreateCameraWithParams(
    'DEFAULT_SCRIPTED_CAMERA',
    camOffset[0],
    camOffset[1],
    camOffset[2],
    0.0,
    0.0,
    0.0,
    30.0,
    false,
    0
  );

  SetCamActive(cam, true);
  RenderScriptCams(true, false, 0, true, true);
  PointCamAtCoord(cam, DEFAULT_SPAWN[0], DEFAULT_SPAWN[1], DEFAULT_SPAWN[2] + 0.1);
  DoScreenFadeIn(200);

  while (camActive) await sleep(0);

  RenderScriptCams(false, false, 0, true, true);
  DestroyCam(cam, false);
}

async function SpawnPlayer(x: number, y: number, z: number, heading: number) {
  SwitchOutPlayer(cache.ped, 0, 1);

  while (GetPlayerSwitchState() !== 5) await sleep(0);

  SetEntityCoordsNoOffset(cache.ped, x, y, z, false, false, false);
  SetEntityHeading(cache.ped, heading);
  RequestCollisionAtCoord(x, y, z);
  DoScreenFadeIn(200);
  SwitchInPlayer(cache.ped);
  SetGameplayCamRelativeHeading(0);

  while (GetPlayerSwitchState() !== 12) await sleep(0);

  while (!HasCollisionLoadedAroundEntity(cache.ped)) await sleep(0);
}

function CreateCharacterMenu(characters: Character[]) {
  //todo: export ContextMenuArrayItem and such from ox_lib
  const options: any[] = new Array(characters.length);

  characters.forEach((character, index) => {
    const coords = character.x ? [character.x, character.y, character.z] : DEFAULT_SPAWN;

    options[index] = {
      title: `${character.firstName} ${character.lastName}`,
      description: `${GetLabelText(GetNameOfZone(coords[0], coords[1], coords[2]))}`,
      onSelect: () => {
        emitNet('ox:setActiveCharacter', character.charId);
      },
    };
  });

  if (characters.length < CHARACTER_SLOTS) {
    options.push({
      title: locale('empty_slot'),
      description: locale('create_character'),
      onSelect: async () => {
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

        if (!input) return showContext('ox:characterSelect');

        const character: NewCharacter = {
          firstName: input[0] as string,
          lastName: input[1] as string,
          gender: input[2] as string,
          date: input[3] as number,
        };

        emitNet('ox:setActiveCharacter', character);
      },
    });
  }

  if (characters.length > 0) {
    options.push({
      title: locale('delete_character'),
      onSelect: async () => {
        const input = await inputDialog(
          locale('delete_character'),
          [
            {
              type: 'select',
              label: locale('select_character'),
              required: true,
              options: characters.map((character, index) => {
                return { label: `${character.firstName} ${character.lastName}`, value: index.toString() };
              }),
            },
          ],
          { allowCancel: true }
        );

        if (!input) return showContext('ox:characterSelect');

      const character = characters[input[0] as number];
      const deleteChar = await alertDialog({
        header: locale('delete_character_title'),
        content: locale('delete_character_confirm', character.firstName, character.lastName),
        cancel: true,
      });

        if (deleteChar === 'confirm') {
          const success = <boolean>await triggerServerCallback('ox:deleteCharacter', 0, character.charId);

          if (success) {
            characters.splice(input[0] as number, 1);
            return CreateCharacterMenu(characters);
          }
        }

        showContext('ox:characterSelect');
      },
    });
  }

  registerContext({
    id: 'ox:characterSelect',
    title: locale('select_character_title'),
    canClose: false,
    options: options,
  });

  showContext('ox:characterSelect');
}

netEvent('ox:startCharacterSelect', async (characters: Character[]) => {
  if (PlayerIsLoaded) {
    DEV: console.info('Character is already loaded - resetting data');
    SetPlayerLoaded(false);
    emit('ox:playerLogout');
    StartSession();
  }

  playerIsHidden = true;
  StartCharacterSelect();

  while (IsScreenFadedOut()) await sleep(0);

  CreateCharacterMenu(characters);
});

netEvent('ox:setActiveCharacter', async (character: Character, userId: number, groups: Record<string, number>) => {
  SetPlayerData(userId, character.charId, character.stateId, groups);

  if (!character.isNew) {
    DoScreenFadeOut(300);

    while (!IsScreenFadedOut()) await sleep(0);
  }

  camActive = false;
  playerIsHidden = false;

  if (character.x) {
    await SpawnPlayer(character.x, character.y, character.z, character.heading);
  } else {
    DoScreenFadeIn(200);

    while (!IsScreenFadedIn()) await sleep(0);
  }

  SetEntityHealth(cache.ped, character.health ?? GetEntityMaxHealth(cache.ped));
  SetPedArmour(cache.ped, character.armour ?? 0);

  DEV: console.info(`Loaded as ${character.firstName} ${character.lastName}`);

  SetPlayerLoaded(true);
  emit('playerSpawned');
  emit('ox:playerLoaded', PlayerData, character.isNew);
});
