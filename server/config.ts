import { DEBUG } from 'config';

export * from '../common/config';

export const CREATE_DEFAULT_ACCOUNT = GetConvarInt('ox:createDefaultAccount', 1) === 1;

export const PROTECT_SERVER_ENTITIES = GetConvarBool('sv_protectServerEntities', false);

if (DEBUG) SetConvar('ox:callbackTimeout', '1200000');
