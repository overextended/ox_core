import React from 'react';
import type { Character } from '../types';

interface ContextValue {
  value: Character[];
  setValue: (character: Character[]) => void;
}

const CharactersCtx = React.createContext<ContextValue | null>(null);

const CharactersPrvoider: React.FC = ({ children }) => {
  const [value, setValue] = React.useState<Character[]>([
    {
      firstname: '',
      lastname: '',
      gender: '',
      location: '',
      dateofbirth: '',
      groups: [''],
      phone_number: '',
      slot: 0,
    },
  ]);

  return <CharactersCtx.Provider value={{ value, setValue }}>{children}</CharactersCtx.Provider>;
};

export default CharactersPrvoider;

export const useCharacters = () =>
  React.useContext<ContextValue>(CharactersCtx as React.Context<ContextValue>);
