import { IconPlayerPlay, IconTrash } from '@tabler/icons';
import { CharacterProps } from '../../../types';
import { useCharacterIndex, useCharacterIndexState } from '../../../state/characters';
import { fetchNui } from '../../../utils/fetchNui';


const Character: React.FC<{ character: CharacterProps, index: number }> = (props) => {
  const [characterIndex, setCharacterIndex] = useCharacterIndexState();

  const playCharacter = () => {
    fetchNui('ox:selectCharacter', props.character.slot);
    //  TODO: Hide UI
  };

  const deleteCharacter = () => {
    fetchNui('ox:deleteCharacter', props.character.slot);
    //  TODO: Remove character from array
  };

  return (
    <div className='flex'>
      <div
        className={`hover-transition flex h-24 w-full flex-col justify-between p-1.5 text-white hover:bg-black/40 ${characterIndex === props.index && 'bg-black/40'}`}
        onClick={() => setCharacterIndex(props.index)}>
        <div className='flex w-full items-center justify-between'>
          <p className='text-xl'>{`${props.character.firstname} ${props.character.lastname}`}</p>
        </div>
        <div>
          <p>Location: {props.character.location}</p>
          <p>Last played: {props.character.last_played}</p>
        </div>
      </div>
      {characterIndex === props.index && (
        <div>
          <div
            onClick={playCharacter}
            className='relative flex w-12 h-1/2 justify-center items-center hover-transition bg-black/50 hover:bg-green-500'>
            <IconPlayerPlay className='text-white' />
          </div>
          <div
            onClick={deleteCharacter}
            className='relative flex h-1/2 justify-center items-center hover-transition bg-black/50 hover:bg-red-500'>
            <IconTrash className='text-white' />
          </div>
        </div>
      )}
    </div>
  );
};

export default Character;
