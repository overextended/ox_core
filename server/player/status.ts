import { addCommand } from '@overextended/ox_lib/server';
import { GetStatuses } from './db';
import { OxPlayer } from './class';

export const Statuses: Dict<OxStatus> = {};

async function LoadStatuses() {
  const rows = await GetStatuses();

  if (!rows[0]) return;

  const players = OxPlayer.getAll();

  for (let i = 0; i < rows.length; i++) {
    const status = rows[i];

    for (const id in players) {
      const player = players[id];
      const value = player.charId && player.getStatus(status.name);

      if (!value || value > 100) player.setStatus(status.name, status.default);
    }

    Statuses[status.name] = status;
    GlobalState[`status.${status.name}`] = status;
  }
}

setImmediate(LoadStatuses);

addCommand('reloadstatuses', LoadStatuses, {
  help: 'Reload statuses from the database.',
  restricted: 'group.admin',
});
