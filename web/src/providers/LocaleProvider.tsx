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
        firstname: 'Confirm',
        lastname: 'Cancel',
        gender: 'Vehicle category',
        male: 'No such vehicle category',
        female: 'Vehicles',
        create_char: 'No vehicles found',
        create_a_char: 'No vehicles found',
        confirm: 'No vehicles found',
        cancel: 'No vehicles found',
        non_binary: 'No vehicles found',
      },
    },
  },
]);

interface Locale {
  ui: {
    firstname: string,
    lastname: string,
    gender: string,
    male: string,
    female: string,
    create_char: string,
    create_a_char: string,
    confirm: string,
    cancel: string,
    non_binary: string,
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
      firstname: '',
      lastname: '',
      gender: '',
      male: '',
      female: '',
      create_char: '',
      create_a_char: '',
      confirm: '',
      cancel: '',
      non_binary: '',
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