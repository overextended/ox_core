import { OxPlayer, Statuses } from 'player';

function UpdateStatuses() {
  for (const name in Statuses) {
    const status = Statuses[name];

    if (!status?.onTick) continue;

    const curValue = OxPlayer.getStatus(name) ?? status.default;
    const newValue = curValue + status.onTick;

    OxPlayer.setStatus(
      name,
      newValue < 0 ? 0 : newValue > 100 ? 100 : Number.parseFloat((newValue).toPrecision(8)),
    );
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
