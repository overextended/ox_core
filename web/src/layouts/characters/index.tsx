import { useNuiEvent } from '../../hooks/useNuiEvent';
import { debugData } from '../../utils/debugData';
import { CharacterProps } from '../../types';
import DeleteCharacter from './components/DeleteCharacter';
import { Sidebar } from './components/Sidebar';
import CreateCharacter from './components/CreateCharacter';
import { useCharacterVisibilityState } from '../../state/visibility';

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

const CharacterSelector: React.FC = () => {

  const [visible, setVisible] = useCharacterVisibilityState();

  useNuiEvent('sendCharacters', () => setVisible(true));

  return (
    <>
      <Sidebar />
      {visible && (
        <>
          <CreateCharacter />
          <DeleteCharacter />
        </>
      )}
    </>
  );
};

export default CharacterSelector;
