import { Context, createContext, useContext, useEffect, useState } from 'react';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { fetchNui } from '../utils/fetchNui';

interface Locale {
  ui: {
    confirm: string,
    cancel: string,
    select: string;
    delete: string,
    firstname: string,
    lastname: string,
    gender: string,
    male: string,
    female: string,
    non_binary: string,
    create_char: string,
    create_a_char: string,
    delete_character: string,
    delete_prompt: string,
    irreversible_action: string,
    char_location: string,
    last_played: string,
    max_chars: string,
    spawn_locations: string,
    select_character: string
  };
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locales: Locale) => void;
}

debugData<Locale>([
  {
    action: 'setLocale',
    data: {
      ui: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        select: 'Select',
        delete: 'Delete',
        firstname: 'First name',
        lastname: 'Last name',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        non_binary: 'Non-Binary',
        create_char: 'Create Character',
        create_a_char: 'Create a Character',
        delete_character: 'Delete Character',
        delete_prompt: 'Are you sure you want to delete %s',
        irreversible_action: 'This action is irreversible',
        char_location: 'Location',
        last_played: 'Last played',
        max_chars: 'Maximum number of slots reached',
        spawn_locations: 'Spawn Locations',
        select_character: 'Select Character',
      },
    },
  },
]);


const LocaleCtx = createContext<LocaleContextValue | null>(null);

const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>({
    ui: {
      confirm: '',
      cancel: '',
      select: '',
      delete: '',
      firstname: '',
      lastname: '',
      gender: '',
      male: '',
      female: '',
      non_binary: '',
      create_char: '',
      create_a_char: '',
      irreversible_action: '',
      delete_character: '',
      delete_prompt: '',
      char_location: '',
      last_played: '',
      max_chars: '',
      spawn_locations: '',
      select_character: '',
    },
  });

  useEffect(() => {
    fetchNui('loadLocale');
  }, []);

  useNuiEvent('setLocale', async (data: Locale) => setLocale(data));

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
};

export default LocaleProvider;

export const useLocales = () => useContext<LocaleContextValue>(LocaleCtx as Context<LocaleContextValue>);
