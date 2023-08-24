import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { CharacterProps } from '../types';

const deleteModalAtom = atom<{ character: CharacterProps, index: number, visible: boolean }>({
  character: {
    firstName: '',
    lastName: '',
    lastPlayed: '',
    gender: '',
    dateOfBirth: '',
  },
  visible: false,
  index: 0,
});

const createModalAtom = atom(false);

export const useDeleteModalValue = () => useAtomValue(deleteModalAtom);
export const useSetDeleteModal = () => useSetAtom(deleteModalAtom);
export const useDeleteModalState = () => useAtom(deleteModalAtom);

export const useCreateModalValue = () => useAtomValue(createModalAtom);
export const useSetCreateModal = () => useSetAtom(createModalAtom);
export const useCreateModalState = () => useAtom(createModalAtom);
