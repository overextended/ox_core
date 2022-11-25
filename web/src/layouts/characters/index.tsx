import CharacterSlot from './components/CharacterSlot';
import { IconUserPlus } from '@tabler/icons';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { useCharactersState } from '../../state/characters';
import { debugData } from '../../utils/debugData';
import { CharacterProps } from '../../types';
import DeleteCharacter from './components/DeleteCharacter';
import { Sidebar } from './components/Sidebar';

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

  return (
    <>
      <Sidebar/>
      <DeleteCharacter />
    </>
  );
};

export default CharacterSelector;
