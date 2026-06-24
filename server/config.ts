import { DEBUG } from 'config';

export * from '../common/config';

export const CREATE_DEFAULT_ACCOUNT = GetConvarInt('ox:createDefaultAccount', 1) === 1;

export const PROTECT_SERVER_ENTITIES = GetConvarInt('sv_protectServerEntities', 0) === 1;

if (DEBUG) SetConvar('ox:callbackTimeout', '1200000');
