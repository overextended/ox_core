import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const characterSelectorVisibilityAtom = atom(false);

export const useCharacterVisibilityValue = () => useAtomValue(characterSelectorVisibilityAtom);
export const useSetCharacterVisibility = () => useSetAtom(characterSelectorVisibilityAtom);
export const useCharacterVisibilityState = () => useAtom(characterSelectorVisibilityAtom);
