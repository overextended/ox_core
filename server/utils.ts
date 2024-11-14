import type { Dict } from 'types';

export function GetPlayerLicense(playerId: number | string) {
  return (
    GetPlayerIdentifierByType(playerId as string, 'license2') ||
    GetPlayerIdentifierByType(playerId as string, 'license')
  );
}

export function GetIdentifiers(playerId: number | string) {
  const identifiers: Dict<string> = {};
  playerId = playerId.toString();

  for (let index = 0; index < GetNumPlayerIdentifiers(playerId); index++) {
    const [prefix, identifier] = GetPlayerIdentifier(playerId, index).split(':');

    if (prefix !== 'ip') identifiers[prefix] = identifier;
  }

  return identifiers;
}

export function GenerateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}