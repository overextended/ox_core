import { IconPlayerPlay } from '@tabler/icons';
import React, { useState } from 'react';
import { useSetSpawnsValue, useSpawnsValue } from '../../state/spawn';
import { Transition } from '@headlessui/react';
import { fetchNui } from '../../utils/fetchNui';
import { useLocales } from '../../providers/LocaleProvider';

const SpawnSelector = () => {
  const { locale } = useLocales();
  const spawns = useSpawnsValue();
  const setSpawns = useSetSpawnsValue();
  const [selectedSpawn, setSelectedSpawn] = useState<number | null>(null);

  const handleSpawnClick = (index: number) => {
    setSelectedSpawn(index);
    fetchNui('clickSpawn', index).then();
  };

  const handleSpawn = (index: number) => {
    fetchNui('selectSpawn', index).then();
    setSpawns([]);
  };

  return (
    <div>
      <div className='p-4 text-center font-text text-zinc-200 text-xl'>{locale.ui.spawn_locations}</div>
      {spawns.map((spawn, index) => (
        <div
          key={spawn}
          onClick={() => handleSpawnClick(index)}
          className={`flex justify-between border-b-[1px] border-b-white/30 p-4 font-text text-zinc-200 truncate ${selectedSpawn === index ? 'bg-black/40' : undefined} hover:bg-black/40 hover-transition`}>
          <div className='truncate'>
            {spawn}
          </div>
          <Transition
            show={selectedSpawn === index}
            as={React.Fragment}
            enter='scale opacity duration-300'
            enterFrom='scale-[0.9] opacity-0'
            enterTo='scale-1 opacity-100'
            leave='scale duration-300'
            leaveFrom='scale-1 opacity-100'
            leaveTo='scale-[0.9] opacity-0'
          >
            <div
              onClick={() => handleSpawn(index)}
              className='flex h-1/2 justify-center items-center text-green-600 hover-transition hover:text-green-500'>
              <IconPlayerPlay />
            </div>
          </Transition>
        </div>
      ))}
    </div>
  );
};

export default SpawnSelector;
