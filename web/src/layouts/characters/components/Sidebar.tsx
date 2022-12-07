import { useNuiEvent } from '../../../hooks/useNuiEvent';
import { CharacterProps } from '../../../types';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import CharacterSelector from '../index';
import { debugData } from '../../../utils/debugData';
import { useCharacterVisibilityState } from '../../../state/visibility';
import { useSetCharacters, useSetMaxCharacterSlots } from '../../../state/characters';

debugData<{ characters: CharacterProps[]; maxSlots: number }>([
  {
    action: 'sendCharacters',
    data: {
      characters: [
        {
          firstname: 'Luke',
          lastname: 'Lukensson',
          last_played: '01/01/1999',
          location: 'Somewhere far away',
          gender: 'male',
          dateofbirth: '01/01/1999',
        },
        {
          firstname: 'Peter',
          lastname: 'Petersson',
          last_played: '01/01/1999',
          location: 'Somewhere far away',
          gender: 'male',
          dateofbirth: '01/01/1999',
        },
      ],
      maxSlots: 5,
    },
  },
]);

export const Sidebar: React.FC = () => {
  const setCharacters = useSetCharacters();
  const [charactersVisible, setCharactersVisible] = useCharacterVisibilityState();
  const setCharacterMaxSlots = useSetMaxCharacterSlots();

  useNuiEvent('sendCharacters', (data: { characters: CharacterProps[]; maxSlots: number }) => {
    setCharacters(data.characters);
    setCharacterMaxSlots(data.maxSlots);
    setCharactersVisible(true);
  });

  return (
    <Transition
      appear
      show={charactersVisible}
      as={Fragment}
      enter='ease-out duration-300'
      enterFrom='opacity-0 translate-x-[-100px]'
      enterTo='opacity-100 translate-x-0'
      leave='ease-in duration-200'
      leaveFrom='opacity-100 translate-x-0'
      leaveTo='opacity-0 translate-x-[-100px]'
    >
      <div className='fixed h-screen w-[300px] bg-gradient-to-r from-black/50 to-transparent'>
        <div className='flex h-full flex-col justify-between font-text'>
          {charactersVisible && (
            <CharacterSelector />
          )}
        </div>
      </div>
    </Transition>
  );
};
