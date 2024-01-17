import { OxVehicle } from './class';

on('onResourceStop', (resource: string) => {
  if (resource !== 'ox_core') return;

  const vehicles = OxVehicle.getAll();

  for (const id in vehicles) {
    vehicles[id].despawn();
  }
});

on('entityRemoved', (entityId: number) => {
  const vehicle = OxVehicle.get(entityId);

  if (!vehicle) return;

  vehicle.setStored('impound', true);
});
