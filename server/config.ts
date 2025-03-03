import { DEBUG } from 'config';

export * from '../common/config';

export const CREATE_DEFAULT_ACCOUNT = GetConvarInt('ox:createDefaultAccount', 1) === 1;

if (DEBUG) GetConvarInt('ox:callbackTimeout', 1_200_000);
