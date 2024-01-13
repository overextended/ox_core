import { locale } from '@overextended/ox_lib/shared';

type Locales = typeof import('../locales/en.json');

//@ts-expect-error
export default (str: keyof Locales, ...args: any[]): string => locale(str, ...args);
