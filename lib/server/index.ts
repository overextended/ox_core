import type { OxVehicle } from 'server/vehicle/class';
import type { PayAccountInvoice, DeleteAccountInvoice } from 'server/accounts';
import type { OxPlayer } from 'server/player/class';
import type { GetCharIdFromStateId } from 'server/player/db';
import type { DeleteAccount, DepositMoney, WithdrawMoney } from 'server/accounts/db';
import type { DeleteGroup, GetGroupsByType, RemoveGroupPermission, SetGroupPermission } from 'server/groups';
import { Ox as OxCore, OxCommon } from 'lib';

interface OxServer extends OxCommon {
  DeleteAccount: typeof DeleteAccount;
  DepositMoney: typeof DepositMoney;
  WithdrawMoney: typeof WithdrawMoney;
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
}

export const Ox = OxCore as OxServer;

export * from './player';
export * from './vehicle';
export * from './account';
