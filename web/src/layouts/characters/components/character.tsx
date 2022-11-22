import { IconUserX, IconUserMinus } from '@tabler/icons';

interface Props {
  firstname: string;
  lastname: string;
  location: string;
  last_played: string;
}

const Character: React.FC<Props> = (props) => {
  return (
    <div className="w-full h-24 hover:bg-black/40 p-1.5 flex justify-between text-white flex-col hover-transition">
      <div className="w-full flex justify-between items-center">
        <p className="text-xl">{`${props.firstname} ${props.lastname}`}</p>
        <div className="pr-1.5">
          {<IconUserMinus className="text-red-600 hover:text-red-500 hover-transition cursor-pointer" />}
        </div>
      </div>
      <div>
        <p>Location: {props.location}</p>
        <p>Last played: {props.last_played}</p>
      </div>
    </div>
  );
};

export default Character;
