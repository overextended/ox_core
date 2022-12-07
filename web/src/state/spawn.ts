import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const spawnAtom = atom<string[]>([]);

export const useSpawnsValue = () => useAtomValue(spawnAtom);
export const useSetSpawnsValue = () => useSetAtom(spawnAtom);
export const useSpawnsState = () => useAtom(spawnAtom);
