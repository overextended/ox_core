interface OxClient {
  [exportKey: string]: Function;
}

export const Ox: OxClient = exports.ox_core;

export * from './player';
