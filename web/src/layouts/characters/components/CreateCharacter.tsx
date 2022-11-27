import React, { FormEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateModalState } from '../../../state/modals';
import GenderSelect from './GenderSelect';
import { useForm } from 'react-hook-form';

export type Inputs = {
  firstName: string
  lastName: string
  day: number;
  month: number;
  year: number;
  gender: string;
}

const validateName = (value: string) => {
  return !value.match(/([0-9])+/g);
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
                    <div className='flex mt-1.5'>
                      {/* TODO: Custom date validation */}
                      <input {...register('day')} placeholder='DD' type='number'
                             className='character-input text-center' />
                      <input {...register('month')} placeholder='MM' type='number'
                             className='character-input text-center' />
                      <input {...register('year')} placeholder='YYYY' type='number'
                             className='character-input text-center' />
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
