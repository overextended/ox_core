import type { OxVehicle } from 'server/vehicle/class';
import type { PayAccountInvoice, DeleteAccountInvoice } from 'server/accounts';
import type { OxPlayer } from 'server/player/class';
import type { BanUser, GetCharIdFromStateId, GetLicense, GetLicenses, UnbanUser } from 'server/player/db';
import type {
  CreateGroup,
  DeleteGroup,
  GetGroupsByType,
  RemoveGroupPermission,
  SetGroupPermission,
} from 'server/groups';
import { Ox as OxCore, type OxCommon } from 'lib';

interface OxServer extends OxCommon {
  SaveAllPlayers: typeof OxPlayer.saveAll;
  SaveAllVehicles: typeof OxVehicle.saveAll;
  GetCharIdFromStateId: typeof GetCharIdFromStateId;
  GenerateVehicleVin: (model: string) => Promise<string>;
  GenerateVehiclePlate: typeof OxVehicle.generatePlate;
  SetGroupPermission: typeof SetGroupPermission;
  RemoveGroupPermission: typeof RemoveGroupPermission;
  PayAccountInvoice: typeof PayAccountInvoice;
  DeleteAccountInvoice: typeof DeleteAccountInvoice;
  GetGroupsByType: typeof GetGroupsByType;
  CreateGroup: typeof CreateGroup;
  DeleteGroup: typeof DeleteGroup;
  GetLicenses: typeof GetLicenses;
  GetLicense: typeof GetLicense;
  BanUser: typeof BanUser;
  UnbanUser: typeof UnbanUser;
}

export const Ox = OxCore as OxServer;

export * from './player';
export * from './vehicle';
export * from './account';
