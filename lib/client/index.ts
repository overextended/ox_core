import { Ox as OxCore, OxCommon } from 'lib';

interface OxClient extends OxCommon {}

export const Ox = OxCore as OxClient;

export * from './player';
