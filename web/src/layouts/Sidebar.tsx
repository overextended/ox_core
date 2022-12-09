import { useNuiEvent } from '../hooks/useNuiEvent';
import { CharacterProps } from '../types';
import React, { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import CharacterSelector from './characters';
import { debugData } from '../utils/debugData';
import { useCharacterVisibilityState } from '../state/visibility';
import { useSetCharacters, useSetMaxCharacterSlots } from '../state/characters';
import { useSpawnsState } from '../state/spawn';
import SpawnSelector from './spawn';

// debugData<{ characters: CharacterProps[]; maxSlots: number }>([
//   {
//     action: 'sendCharacters',
//     data: {
//       characters: [
//         {
//           firstname: 'Luke',
//           lastname: 'Lukensson',
//           last_played: '01/01/1999',
//           location: 'Somewhere far away',
//           gender: 'male',
//           dateofbirth: '01/01/1999',
//         },
//         {
//           firstname: 'Peter',
//           lastname: 'Petersson',
//           last_played: '01/01/1999',
//           location: 'Somewhere far away',
//           gender: 'male',
//           dateofbirth: '01/01/1999',
//         },
//       ],
//       maxSlots: 5,
//     },
//   },
// ]);

debugData<string[]>([{
  action: 'sendSpawns',
  data: [
    'Last location',
    'Legion Square',
    'Route 86',
    'Paleto Bay',
    'Bollywood',
  ],
}]);

export const Sidebar: React.FC = () => {
  const setCharacters = useSetCharacters();
  const [charactersVisible, setCharactersVisible] = useCharacterVisibilityState();
  const setCharacterMaxSlots = useSetMaxCharacterSlots();
  const [spawns, setSpawns] = useSpawnsState();

  useNuiEvent('sendCharacters', (data: { characters: CharacterProps[]; maxSlots: number }) => {
    setCharacters(data.characters);
    setCharacterMaxSlots(data.maxSlots);
    setCharactersVisible(true);
  });

  useNuiEvent('sendSpawns', (data: string[]) => {
    setSpawns(data);
  });

  return (
    <Transition
      appear
      show={charactersVisible || spawns.length > 0}
      as={Fragment}
      enter='ease-out duration-300'
      enterFrom='opacity-0 translate-x-[-100px]'
      enterTo='opacity-100 translate-x-0'
      leave='ease-in duration-200'
      leaveFrom='opacity-100 translate-x-0'
      leaveTo='opacity-0 translate-x-[-100px]'
    >
      <div className='fixed h-screen w-[300px] bg-gradient-to-r from-black/50 to-black/10'>
        <div className='flex h-full flex-col justify-between font-text'>
          {charactersVisible && (
            <CharacterSelector />
          )}
          {spawns.length > 0 && (
            <SpawnSelector />
          )}
        </div>
      </div>
    </Transition>
  );
};
