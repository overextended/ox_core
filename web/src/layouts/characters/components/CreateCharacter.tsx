import React, { FormEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateModalState } from '../../../state/modals';
import GenderSelect from './GenderSelect';
import { useForm } from 'react-hook-form';
import { fetchNui } from '../../../utils/fetchNui';
import { useSetCharacterVisibility } from '../../../state/visibility';
import { useLocales } from '../../../providers/LocaleProvider';

export type Inputs = {
  firstName: string
  lastName: string
  dob: string;
  gender: string;
}

const currentDate = new Date();

const validateName = (value: string) => {
  return !value.match(/([0-9])+/g);
};

const validateDate = (date: string) => {
  const validDate = new Date(date);
  const [day, month, year] = [validDate.getDate(), validDate.getMonth() + 1, validDate.getFullYear()];
  const [currentDay, currentMonth, currentYear] = [currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear()];
  if (month > currentMonth) return false;
  if (month === currentMonth && day > currentDay) return false;
  return !(year < 1900 || year > currentYear);
};

export const CreateCharacter: React.FC = () => {
  const { locale } = useLocales();
  const [createModal, setCreateModal] = useCreateModalState();
  const setVisible = useSetCharacterVisibility();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<Inputs>();

  const onSubmit = handleSubmit(data => {
    // Normalize inputs
    data.firstName = data.firstName[0].toUpperCase() + data.firstName.slice(1).toLowerCase();
    data.lastName = data.lastName[0].toUpperCase() + data.lastName.slice(1).toLowerCase();
    fetchNui('ox:selectCharacter', {
      firstName: data.firstName,
      lastName: data.lastName,
      date: data.dob,
      gender: data.gender,
    });
    setCreateModal(false);
    reset();
    setVisible(false);
  });

  return (
    <Transition appear show={createModal} as={React.Fragment}>
      <Dialog as='div' className='relative z-10 font-text' onClose={() => {
      }}>
        <Transition.Child
          as={React.Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex flex-col min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={React.Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <Dialog.Panel
                className='w-[300px] max-w-md transform bg-black/50 p-4 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title
                  as='h3'
                  className='text-lg text-zinc-100 text-center leading-6'
                >
                  {locale.ui.create_char}
                </Dialog.Title>

                <form onSubmit={onSubmit}>
                  <div className='flex flex-col justify-center w-full items-start text-zinc-100 p-2'>
                    <input
                      {...register('firstName', { required: true, validate: validateName })}
                      className={`character-input ${errors.firstName ? 'character-input-error' : undefined}`}
                      placeholder={locale.ui.firstname} />
                    <input {...register('lastName', { required: true, validate: validateName })}
                           className={`character-input mt-1.5 ${errors.lastName ? 'character-input-error' : undefined}`}
                           placeholder={locale.ui.lastname} />
                    <input type='date'
                           className={`character-input mt-1.5 ${errors.dob ? 'character-input-error' : undefined}`} {...register('dob', {
                      required: true,
                      validate: validateDate,
                    })} />
                    <GenderSelect register={{ ...register('gender', { required: true }) }} setValue={setValue} />
                  </div>

                  <div className='mt-4 flex w-full items-center justify-center'>
                    <button
                      type='submit'
                      className='p-2 bg-black/40 text-zinc-100 font-text w-28 hover:bg-green-500 focus:bg-black/30 hover-transition ml-3'>
                      {locale.ui.confirm}
                    </button>
                    <button
                      onClick={() => {
                        setCreateModal(false);
                        reset();
                      }}
                      className='p-2 bg-black/40 text-zinc-100 font-text w-28 hover:bg-black/20 focus:bg-black/30 hover-transition ml-3'>
                      {locale.ui.cancel}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateCharacter;
