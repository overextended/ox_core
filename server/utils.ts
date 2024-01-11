export function GetIdentifiers(playerId: number | string) {
  const identifiers: Dict<string> = {};
  playerId = playerId.toString();

  for (let index = 0; index < GetNumPlayerIdentifiers(playerId); index++) {
    const [prefix, identifier] = GetPlayerIdentifier(playerId, index).split(':');

    if (prefix !== 'ip') identifiers[prefix] = identifier;
  }

  return identifiers;
}
