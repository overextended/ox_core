import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateModalState } from '../../../state/modals';
import StyledSelect from './StyledSelect';

export const CreateCharacter: React.FC = () => {
  const [createModal, setCreateModal] = useCreateModalState();

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

                <div className='flex flex-col justify-center w-full items-start text-white p-2'>
                  <input
                    className='character-input'
                    placeholder='First name' />
                  <input className='character-input mt-1.5' placeholder='Last name' />
                  <div className='flex mt-1.5'>
                    <input placeholder='DD' className='character-input text-center' />
                    <input placeholder='MM' className='character-input text-center' />
                    <input placeholder='YYYY' className='character-input text-center' />
                  </div>
                  <StyledSelect />
                </div>


                <div className='mt-4 flex w-full items-center justify-center'>
                  <button
                    onClick={() => setCreateModal(false)}
                    className='p-2 bg-black/40 text-white font-text w-28 hover:bg-green-500 focus:bg-black/30 hover-transition ml-3'>
                    Confirm
                  </button>
                  <button
                    onClick={() => setCreateModal(false)}
                    className='p-2 bg-black/40 text-white font-text w-28 hover:bg-black/30 focus:bg-black/30 hover-transition ml-3'>
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateCharacter;
