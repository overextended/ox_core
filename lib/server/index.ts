interface OxServer {
  [exportKey: string]: Function;
}

export const Ox: OxServer = exports.ox_core;

export * from './player';
