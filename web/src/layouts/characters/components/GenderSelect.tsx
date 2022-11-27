import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons';

const options = [
  { name: 'Male', value: 'male' },
  { name: 'Female', value: 'female' },
  { name: 'Non-Binary', value: 'non-binary' },
];

export const GenderSelect: React.FC = () => {
  const [selected, setSelected] = useState(options[0]);

  return (
    <div className='w-full font-text'>
      <Listbox value={selected} onChange={setSelected}>
        <div className='relative mt-1'>
          <Listbox.Button
            className='relative w-full cursor-default character-input flex justify-between text-left shadow-md focus:outline-none sm:text-sm'>
            <span className='block truncate'>{selected.name}</span>
            <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400'>
                <IconChevronDown />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave='transition ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Listbox.Options
              className='absolute z-40 mt-1 max-h-60 w-full overflow-auto bg-black/80 py-1 font-text shadow-lg focus:outline-none sm:text-sm'>
              {options.map((person, personIdx) => (
                <Listbox.Option
                  key={personIdx}
                  className={({ active }) =>
                    `relative cursor-default flex w-full justify-between select-none py-2 pr-4 pl-2 ${
                      active ? 'bg-blue-500' : 'text-white'
                    }`
                  }
                  value={person}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {person.name}
                      </span>
                      {selected ? (
                        <span
                          className={`inset-y-0 left-0 flex items-center ${active ? 'text-white' : 'text-blue-500'}`}>
                          <IconCheck size={20} />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default GenderSelect;
