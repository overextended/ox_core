import CharacterSlot from './components/CharacterSlot';
import { IconUserPlus } from '@tabler/icons';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { useCharactersState } from '../../state/characters';
import { debugData } from '../../utils/debugData';
import { CharacterProps } from '../../types';

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
          slot: 0,
        },
        {
          firstname: 'Peter',
          lastname: 'Petersson',
          last_played: '01/01/1999',
          location: 'Somewhere far away',
          gender: 'male',
          dateofbirth: '01/01/1999',
          slot: 1,
        },
      ],
      maxSlots: 5,
    },
  },
]);

const CharacterSelector: React.FC = () => {
  const [characters, setCharacters] = useCharactersState();

  useNuiEvent('sendCharacters', (data: { characters: CharacterProps[]; maxSlots: number }) => {
    setCharacters(data.characters);
  });

  return (
    <>
      <div className='fixed h-screen w-[300px] bg-gradient-to-r from-black/50 to-transparent'>
        <div className='flex h-full flex-col justify-between font-text'>
          <div>
            {characters.map((character, index) => (
              <CharacterSlot
                character={character}
                index={index}
                key={`${character.firstname}-${character.lastname}-${character.last_played}`}
              />
            ))}
          </div>
          <div
            className='hover-transition mb-10 flex w-full items-center justify-evenly p-3 text-center text-white hover:bg-black/40'>
            <IconUserPlus />
            <p className='text-xl'>Create a character</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterSelector;
