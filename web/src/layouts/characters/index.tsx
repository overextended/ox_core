import Character from './components/character';
import { IconUserPlus } from '@tabler/icons';

const debugCharacters = [
  { firstname: 'Peter', lastname: 'Petersson', last_played: '01/01/1999', location: 'Far far away' },
  { firstname: 'Luke', lastname: 'Lukensson', last_played: '01/01/1999', location: 'Far far away' },
];

const CharacterSelector: React.FC = () => {
  return (
    <div className="fixed w-[300px] bg-gradient-to-r from-black/50 to-transparent h-screen">
      <div className="flex flex-col justify-between font-text h-full">
        <div>
          {debugCharacters.map((character) => (
            <Character {...character} key={`${character.firstname}-${character.lastname}-${character.last_played}`} />
          ))}
        </div>
        <div className="text-white w-full text-center uppercase mb-10 flex justify-evenly items-center hover-transition hover:bg-black/40 p-3">
          <IconUserPlus />
          <p className="text-xl">Create character</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelector;
