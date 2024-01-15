import { OnPlayerLoaded } from '../player/events';

SetConvarReplicated('inventory:framework', 'ox');
SetConvarReplicated('inventory:trimplate ', 'false');

OnPlayerLoaded('ox_inventory', (player) => {
  exports.ox_inventory.setPlayerInventory({
    source: player.source,
    identifier: player.charId,
    name: `${player.get('firstName')} ${player.get('lastName')}`,
    sex: player.get('gender'),
    dateofbirth: player.get('dateofbirth'),
    groups: {},
  });
});
