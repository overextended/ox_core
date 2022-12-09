import DeleteCharacter from './components/DeleteCharacter';
import CreateCharacter from './components/CreateCharacter';
import CharacterSlot from './components/CharacterSlot';
import { IconUserPlus } from '@tabler/icons';
import ReactTooltip from 'react-tooltip';
import { useCharacters, useMaxSlotsValue } from '../../state/characters';
import { useSetCreateModal } from '../../state/modals';
import { useLocales } from '../../providers/LocaleProvider';
import React from 'react';


const CharacterSelector: React.FC = () => {
  const { locale } = useLocales();
  const maxSlots = useMaxSlotsValue();
  const characters = useCharacters();
  const setCreateModal = useSetCreateModal();

  return (
    <>
      <div>
        <div className='p-4 text-center font-text text-zinc-200 text-xl'>{locale.ui.select_character}</div>
        <div className='overflow-y-scroll'>
          {characters.map((character, index) => (
            <CharacterSlot
              character={character}
              index={index}
              key={`${character.firstname}-${character.lastname}-${character.last_played}`}
            />
          ))}
        </div>
      </div>
      <div>
        <div
          data-tip={characters.length >= maxSlots ? locale.ui.max_chars : undefined}
          onClick={() => !(characters.length >= maxSlots) && setCreateModal(true)}
          className={`${characters.length >= maxSlots ? 'opacity-50 bg-black/40' : undefined} hover-transition mb-10 flex w-full items-center justify-evenly p-3 text-center text-zinc-100 hover:bg-black/40`}
        >
          <IconUserPlus />
          <p className='text-xl'>{locale.ui.create_a_char}</p>
        </div>
        <ReactTooltip
          effect='solid'
          className='p-2 text-zinc-100 font-text text-sm bg-black/50'
          offset={{ 'top': 10 }}
          disableInternalStyle
        />
      </div>
      <CreateCharacter />
      <DeleteCharacter />
    </>
  );
};

export default CharacterSelector;
