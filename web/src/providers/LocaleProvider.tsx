import { Context, createContext, useContext, useEffect, useState } from 'react';
import { useIsFirstRender } from '../hooks/useIsFirstRender';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { debugData } from '../utils/debugData';
import { fetchNui } from '../utils/fetchNui';
import { isEnvBrowser } from '../utils/misc';

debugData([
  {
    action: 'setLocale',
    data: {
      ui: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        delete: 'Delete',
        firstname: 'First Name',
        lastname: 'Last Name',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        non_binary: 'Non-Binary',
        create_char: 'Create Character',
        create_a_char: 'Create a new Character',
        irreversible_ation: 'This action is irreversible',
      },
    },
  },
]);

interface Locale {
  ui: {
    confirm: string,
    cancel: string,
    delete: string,
    firstname: string,
    lastname: string,
    gender: string,
    male: string,
    female: string,
    non_binary: string,
    create_char: string,
    create_a_char: string,
    irreversible_ation: string,
  };
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locales: Locale) => void;
}

const LocaleCtx = createContext<LocaleContextValue | null>(null);

const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isFirst = useIsFirstRender();
  const [locale, setLocale] = useState<Locale>({
    ui: {
      confirm: '',
      cancel: '',
      delete: '',
      firstname: '',
      lastname: '',
      gender: '',
      male: '',
      female: '',
      non_binary: '',
      create_char: '',
      create_a_char: '',
      irreversible_ation: '',
    },
  });

  useEffect(() => {
    if (!isFirst && !isEnvBrowser()) return;
    fetchNui('loadLocale');
  }, []);

  useNuiEvent('setLocale', async (data: Locale) => setLocale(data));

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
};

export default LocaleProvider;

export const useLocales = () => useContext<LocaleContextValue>(LocaleCtx as Context<LocaleContextValue>);