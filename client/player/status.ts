import { OxPlayer, Statuses } from 'player';

function UpdateStatuses() {
  for (const name in OxPlayer.getStatuses()) {
    const onTick = Statuses[name].onTick;

    if (!onTick) continue;

    const value = onTick + (OxPlayer.statuses[name] || 0);
    OxPlayer.statuses[name] =
      value < 0 ? 0 : value > 100 ? 100 : Number((onTick + (OxPlayer.statuses[name] || 0)).toPrecision(3));
  }

  emit('ox:statusTick', OxPlayer.getStatuses());
  emitNet('ox:updateStatuses', OxPlayer.getStatuses());
}

on('ox:playerLoaded', () => {
  const id: CitizenTimer = setInterval(() => {
    if (!OxPlayer.isLoaded) return clearInterval(id);

    UpdateStatuses();
  }, 1000);
});
