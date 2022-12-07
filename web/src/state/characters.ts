import { atom, useAtomValue, useSetAtom, useAtom } from 'jotai';
import { CharacterProps } from '../types';

const charactersAtom = atom<CharacterProps[]>([]);
const characterIndexAtom = atom<number | null>(null);
const maxCharacterSlotsAtom = atom<number>(0);

export const useCharacters = () => useAtomValue(charactersAtom);
export const useSetCharacters = () => useSetAtom(charactersAtom);
export const useCharactersState = () => useAtom(charactersAtom);

export const useCharacterIndex = () => useAtomValue(characterIndexAtom);
export const useSetCharacterIndex = () => useSetAtom(characterIndexAtom);
export const useCharacterIndexState = () => useAtom(characterIndexAtom);

export const useMaxSlotsValue = () => useAtomValue(maxCharacterSlotsAtom);
export const useSetMaxCharacterSlots = () => useSetAtom(maxCharacterSlotsAtom);
