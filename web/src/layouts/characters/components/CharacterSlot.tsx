import { IconPlayerPlay, IconTrash } from '@tabler/icons';
import { CharacterProps } from '../../../types';
import { Transition } from '@headlessui/react';
import { useCharacterIndexState } from '../../../state/characters';
import { fetchNui } from '../../../utils/fetchNui';
import React from 'react';
import { useSetDeleteModal } from '../../../state/modals';
import { useSetCharacterVisibility } from '../../../state/visibility';
import { useLocales } from '../../../providers/LocaleProvider';


const Character: React.FC<{ character: CharacterProps, index: number }> = (props) => {
  const { locale } = useLocales();
  const [characterIndex, setCharacterIndex] = useCharacterIndexState();
  const setVisible = useSetCharacterVisibility();
  const setDeleteModal = useSetDeleteModal();

  const playCharacter = () => {
    fetchNui('ox:selectCharacter', props.index);
    setVisible(false);
  };

  const selectCharacter = () => {
    setCharacterIndex(props.index);
    fetchNui('ox:setCharacter', props.index);
  };

  return (
    <>
      <div className='flex border-b-[1px] border-b-white/30'>
        <div
          className={`hover-transition flex h-24 w-full justify-between text-zinc-100 hover:bg-black/40 ${characterIndex === props.index && 'bg-black/40'}`}
          onClick={selectCharacter}>
          <div className='h-full p-1.5 flex flex-col justify-evenly truncate'>
            <p className='truncate text-2xl'>{`${props.character.firstname} ${props.character.lastname}`}</p>
            <div>
              <p className='truncate text-sm'>{locale.ui.char_location}: {props.character.location}</p>
              <p className='truncate text-sm'>{locale.ui.last_played}: {props.character.last_played}</p>
            </div>
          </div>
          <div>
            <Transition
              show={characterIndex === props.index}
              as={React.Fragment}
              enter='scale opacity duration-300'
              enterFrom='scale-[0.9] opacity-0'
              enterTo='scale-1 opacity-100'
              leave='scale duration-300'
              leaveFrom='scale-1 opacity-100'
              leaveTo='scale-[0.9] opacity-0'
            >
              <div className='h-full w-[50px]'>
                <div
                  onClick={playCharacter}
                  className='relative flex w-full h-1/2 justify-center items-center text-green-600 hover-transition hover:text-green-500'>
                  <IconPlayerPlay />
                </div>
                <div
                  onClick={() => setDeleteModal({ character: props.character, index: props.index, visible: true })}
                  className='relative flex w-full h-1/2 justify-center items-center text-red-600 hover-transition hover:text-red-500'>
                  <IconTrash />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </>
  );
};

export default Character;
