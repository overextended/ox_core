import { OxPlayer, Statuses } from 'player';

function UpdateStatuses() {
  for (const name in OxPlayer.statuses) {
    const onTick = Statuses[name].onTick;

    if (!onTick) continue;

    const value = onTick + (OxPlayer.statuses[name] || 0);
    OxPlayer.statuses[name] =
      value < 0 ? 0 : value > 100 ? 100 : Number((onTick + (OxPlayer.statuses[name] || 0)).toPrecision(3));
  }

  emit('ox:statusTick', OxPlayer.statuses);
  emitNet('ox:updateStatuses', OxPlayer.statuses)
}

on('ox:playerLoaded', () => {
  const id: CitizenTimer = setInterval(() => {
    if (!OxPlayer.isLoaded) return clearInterval(id);

    UpdateStatuses();
  }, 1000);
});
