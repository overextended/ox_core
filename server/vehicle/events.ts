import { OxVehicle } from './class';
import { PROTECT_SERVER_ENTITIES } from '../config';

on('onResourceStop', (resource: string) => OxVehicle.saveAll(resource));

if (!PROTECT_SERVER_ENTITIES) {
  console.warn(
    "^3sv_protectServerEntities is not enabled - falling back to 'entityRemoved' event to respawn vehicles deleted by clients, which may degrade performance. Enable sv_protectServerEntities to avoid this.^0",
  );

  on('entityRemoved', (entityId: number) => OxVehicle.getFromEntity(entityId)?.respawn());
}
