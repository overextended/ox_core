import React, { FormEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateModalState } from '../../../state/modals';
import GenderSelect from './GenderSelect';
import { useForm } from 'react-hook-form';
import * as dayjs from 'dayjs';

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
  const validDate = dayjs(date);
  const [day, month, year] = [validDate.get('date'), validDate.get('month') + 1, validDate.get('year')];
  const [currentDay, currentMonth, currentYear] = [currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear()];
  if (month > currentMonth) return false;
  if (month === currentMonth && day > currentDay) return false;
  if (year < 1900 || year > currentYear) return false;
  return dayjs(date, 'YYYY-MM-DD', true).isValid();
};

export const CreateCharacter: React.FC = () => {
  const [createModal, setCreateModal] = useCreateModalState();
  const { register, handleSubmit, watch, formState: { errors }, setValue, getValues } = useForm<Inputs>();

  const onSubmit = handleSubmit(data => console.log(data));

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
              enterFrom='opacity-0 translate-y-[-100px]'
              enterTo='opacity-100 translate-y-0'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0'
              leaveTo='opacity-0 translate-y-[-100px]'
            >
              <Dialog.Panel
                className='w-[300px] max-w-md transform bg-black/50 p-4 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title
                  as='h3'
                  className='text-lg text-white text-center leading-6'
                >
                  Create character
                </Dialog.Title>

                <form onSubmit={onSubmit}>
                  <div className='flex flex-col justify-center w-full items-start text-white p-2'>
                    <input
                      {...register('firstName', { required: true, validate: validateName })}
                      className={`character-input ${errors.firstName ? 'character-input-error' : undefined}`}
                      placeholder='First name' />
                    <input {...register('lastName', { required: true, validate: validateName })}
                           className={`character-input mt-1.5 ${errors.lastName ? 'character-input-error' : undefined}`}
                           placeholder='Last name' />
                    <div className='flex w-full mt-1.5'>
                      <input placeholder='Date of birth' type='date'
                             className={`character-input ${errors.dob ? 'character-input-error' : undefined}`} {...register('dob', {
                        required: true,
                        validate: validateDate,
                      })} />
                    </div>
                    <GenderSelect props={{ ...register('gender') }} setValue={setValue} />
                  </div>

                  <div className='mt-4 flex w-full items-center justify-center'>
                    <button
                      type='submit'
                      className='p-2 bg-black/40 text-white font-text w-28 hover:bg-green-500 focus:bg-black/30 hover-transition ml-3'>
                      Confirm
                    </button>
                    <button
                      onClick={() => setCreateModal(false)}
                      className='p-2 bg-black/40 text-white font-text w-28 hover:bg-black/30 focus:bg-black/30 hover-transition ml-3'>
                      Cancel
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
