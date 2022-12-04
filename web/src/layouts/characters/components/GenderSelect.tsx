import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useState, forwardRef, MutableRefObject, useMemo } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons';
import { UseFormRegisterReturn, UseFormSetValue } from 'react-hook-form';
import { Inputs } from './CreateCharacter';
import { useLocales } from '../../../providers/LocaleProvider';

type RefProps = { register: UseFormRegisterReturn, setValue: UseFormSetValue<Inputs> }

export const GenderSelect = forwardRef<MutableRefObject<any>, RefProps>((props, ref) => {
  const { locale } = useLocales();
  const [selected, setSelected] = useState<{ name: string; value: string; } | null>(null);

  const options = useMemo(() => {
    return [
      { name: locale.ui.male, value: 'male' },
      { name: locale.ui.female, value: 'female' },
      { name: locale.ui.non_binary, value: 'non-binary' },
    ];
  }, [locale]);

  const handleChange = (val: { name: string, value: string } | null) => {
    if (!val) return;
    setSelected(val);
    props.setValue('gender', val.value);
  };

  return (
    <div className='w-full font-text'>
      <Listbox value={selected} {...props.register} onChange={val => handleChange(val)}>
        <div className='relative mt-1'>
          <Listbox.Button
            className={`relative w-full cursor-default ${!selected && 'character-input-error'} character-input flex justify-between items-center text-left shadow-md focus:outline-none sm:text-sm`}>
            <span className='block truncate'>{selected?.name || locale.ui.gender}</span>
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
                      active ? 'bg-blue-500' : 'text-zinc-100'
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
                          className={`inset-y-0 left-0 flex items-center ${active ? 'text-zinc-100' : 'text-blue-500'}`}>
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
});

export default GenderSelect;
