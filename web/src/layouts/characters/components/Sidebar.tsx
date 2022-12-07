import CharacterSlot from './CharacterSlot';
import { IconUserPlus } from '@tabler/icons';
import { useCharactersState } from '../../../state/characters';
import { useNuiEvent } from '../../../hooks/useNuiEvent';
import { CharacterProps } from '../../../types';
import { useSetCreateModal } from '../../../state/modals';
import { useCharacterVisibilityState } from '../../../state/visibility';
import { Fragment, useState } from 'react';
import ReactTooltip from 'react-tooltip';
import { useLocales } from '../../../providers/LocaleProvider';
import { Transition } from '@headlessui/react';

export const Sidebar: React.FC = () => {
  const { locale } = useLocales();
  const [maxSlots, setMaxSlots] = useState(0);
  const [characters, setCharacters] = useCharactersState();
  const [visible, setVisible] = useCharacterVisibilityState();
  const setCreateModal = useSetCreateModal();

  useNuiEvent('sendCharacters', (data: { characters: CharacterProps[]; maxSlots: number }) => {
    setCharacters(data.characters);
    setMaxSlots(data.maxSlots);
    setVisible(true);
  });

  return (
    <Transition
      appear
      show={visible}
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
          <div className='overflow-y-scroll'>
            {characters.map((character, index) => (
              <CharacterSlot
                character={character}
                index={index}
                key={`${character.firstname}-${character.lastname}-${character.last_played}`}
              />
            ))}
          </div>
          <div
            data-tip={characters.length >= maxSlots ? locale.ui.max_chars : undefined}
            onClick={() => !(characters.length >= maxSlots) && setCreateModal(true)}
            className={`${characters.length >= maxSlots ? 'opacity-50 bg-black/40' : undefined} hover-transition mb-10 flex w-full items-center justify-evenly p-3 text-center text-zinc-100 hover:bg-black/40`}
          >
            <IconUserPlus />
            <p className='text-xl'>{locale.ui.create_a_char}</p>
          </div>
        </div>
        <ReactTooltip effect='solid' className='p-2 text-zinc-100 font-text text-sm bg-black/50'
                      offset={{ 'top': 10 }}
                      disableInternalStyle />
      </div>
    </Transition>
  );
};
