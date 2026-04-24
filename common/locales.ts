import { locale, type FlattenObjectKeys } from '@communityox/ox_lib';

type Locales = FlattenObjectKeys<typeof import('../locales/en.json')>;

export default <T extends Locales>(str: T, ...args: any[]) => locale(str, ...args) as string;
