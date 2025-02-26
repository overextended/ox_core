import { SV_LAN } from 'config';
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

  if (!identifiers.license2) {
    identifiers.license2 = SV_LAN ? 'fayoum' : identifiers.license;

    if (!identifiers.license2) throw new Error(`No license2 found for user [${playerId}] ${GetPlayerName(playerId)}`);
  }

  return identifiers;
}
