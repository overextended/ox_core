import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDeleteModalState, useDeleteModalValue } from '../../../state/modals';
import { fetchNui } from '../../../utils/fetchNui';
import { useSetCharacters } from '../../../state/characters';
import { useLocales } from '../../../providers/LocaleProvider';

export const DeleteCharacter: React.FC = () => {
  const { locale } = useLocales();
  const [deleteModal, setDeleteModal] = useDeleteModalState();
  const [disableDelete, setDisableDelete] = React.useState(false);
  const setCharacters = useSetCharacters();

  React.useEffect(() => {
    // Disables the confirm button for 2 seconds after opening the dialog
    if (deleteModal.visible) {
      setDisableDelete(true);
      setTimeout(() => {
        setDisableDelete(false);
      }, 2000);
    }
  }, [deleteModal]);

  const handleDelete = () => {
    fetchNui('ox:deleteCharacter', deleteModal.index);
    setCharacters(prev => prev.filter((_, index) => index !== deleteModal.index));
    setDeleteModal(state => ({ ...state, visible: false }));
  };

  return (
    <>
      <Transition appear show={deleteModal.visible} as={React.Fragment}>
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
            <div className='flex flex-col min-h-full items-center justify-start p-4 text-center'>
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
                  className='w-full max-w-md transform overflow-hidden bg-black/50 p-4 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title
                    as='h3'
                    className='text-lg text-zinc-100 leading-6'
                  >
                    {locale.ui.delete_character}
                  </Dialog.Title>
                  <div className='mt-2'>
                    <p className='text-zinc-100'>
                      {locale.ui.delete_prompt.replace('%s', `${deleteModal.character.firstname} ${deleteModal.character.lastname}?`)}
                    </p>
                    <p className='text-red-500'>
                      {locale.ui.irreversible_action}.
                    </p>
                  </div>

                  <div className='mt-4 flex w-full items-center justify-end'>
                    <button
                      disabled={disableDelete}
                      className={`p-2 ${disableDelete ? 'opacity-50' : 'hover:bg-red-500 focus:bg-red-500'} bg-black/40 text-zinc-100 font-text w-28 hover-transition`}
                      onClick={handleDelete}
                    >
                      {locale.ui.delete}
                    </button>
                    <button
                      onClick={() => setDeleteModal(state => ({ ...state, visible: false }))}
                      className='p-2 bg-black/40 text-zinc-100 font-text w-28 hover:bg-black/20 focus:bg-black/30 hover-transition ml-3'>
                      {locale.ui.cancel}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default DeleteCharacter;
