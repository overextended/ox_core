import { addCommand, onClientCallback } from '@overextended/ox_lib/server';
import { GetLicenses } from './db';
import { Dict } from 'types';
import { OxPlayer } from './class';

export const Licenses: Dict<{ label: string }> = {};

async function LoadLicenses() {
  const rows = await GetLicenses();

  if (!rows[0]) return;

  for (let i = 0; i < rows.length; i++) {
    const license = rows[i];
    const name = license.name as string;
    delete license.name;

    Licenses[name] = license;
    GlobalState[`license.${name}`] = license;
  }
}

setImmediate(LoadLicenses);

addCommand('reloadlicenses', LoadLicenses, {
  help: 'Reload licenses from the database.',
  restricted: 'group.admin',
});

onClientCallback('ox:getLicense', (playerId, licenseName: string, target?: number) => {
  const player = OxPlayer.get(target || playerId);

  if (player) return licenseName ? player.getLicense(licenseName) : player.getLicenses();
});
