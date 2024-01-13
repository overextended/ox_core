// Is there a better day to do this?

import { locale } from '@overextended/ox_lib/shared';

type Locales = typeof import('../locales/en.json');

//@ts-expect-error
export default <K extends keyof Locales>(str: K, ...args: any[]): Locales[K] => locale;
