import { PlayerIsLoaded, PlayerStatuses, Statuses } from 'player';

function UpdateStatuses() {
  for (const name in PlayerStatuses) {
    const onTick = Statuses[name].onTick;

    if (!onTick) continue;

    const value = onTick + (PlayerStatuses[name] || 0);
    PlayerStatuses[name] =
      value < 0 ? 0 : value > 100 ? 100 : Number((onTick + (PlayerStatuses[name] || 0)).toPrecision(3));
  }

  emit('ox:statusTick', PlayerStatuses);
  emitNet('ox:updateStatuses', PlayerStatuses)
}

on('ox:playerLoaded', () => {
  const id: CitizenTimer = setInterval(() => {
    if (!PlayerIsLoaded) return clearInterval(id);

    UpdateStatuses();
  }, 1000);
});
