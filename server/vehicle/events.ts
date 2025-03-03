import { OxVehicle } from './class';

on('onResourceStop', (resource: string) => OxVehicle.saveAll(resource));

on('entityRemoved', (entityId: number) => OxVehicle.getFromEntity(entityId)?.respawn());
