import { OxVehicle } from './class';

on('onResourceStop', (resource: string) => OxVehicle.saveAll(resource));

on('entityRemoved', (entityId: number) => OxVehicle.get(entityId)?.respawn());
