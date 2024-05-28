import type { OxVehicle } from 'server/vehicle/class';
import type {
  GetAccountById,
  GetCharacterAccounts,
  GetGroupAccounts,
  AddAccountBalance,
  RemoveAccountBalance,
  TransferAccountBalance,
  CreateAccount,
  CreateGroupAccount,
  GetCharacterAccount,
  GetGroupAccount,
  GetAccountRole,
  RemoveAccountAccess,
  SetAccountAccess,
} from 'server/accounts';
import type { OxPlayer } from 'server/player/class';
import type { GetCharIdFromStateId } from 'server/player/db';
import type { DeleteAccount, DepositMoney, WithdrawMoney } from 'server/accounts/db';
import type { RemoveGroupPermission, SetGroupPermission } from 'server/groups';
import { Ox as OxCore, OxCommon } from 'lib';

interface OxServer extends OxCommon {
  GetAccountById: typeof GetAccountById;
  GetCharacterAccount: typeof GetCharacterAccount;
  GetGroupAccount: typeof GetGroupAccount;
  GetCharacterAccounts: typeof GetCharacterAccounts;
  GetGroupAccounts: typeof GetGroupAccounts;
  AddAccountBalance: typeof AddAccountBalance;
  RemoveAccountBalance: typeof RemoveAccountBalance;
  TransferAccountBalance: typeof TransferAccountBalance;
  CreateAccount: typeof CreateAccount;
  CreateGroupAccount: typeof CreateGroupAccount;
  DeleteAccount: typeof DeleteAccount;
  GetAccountRole: typeof GetAccountRole;
  DepositMoney: typeof DepositMoney;
  WithdrawMoney: typeof WithdrawMoney;
  SetAccountAccess: typeof SetAccountAccess;
  RemoveAccountAccess: typeof RemoveAccountAccess;
  SaveAllPlayers: typeof OxPlayer.saveAll;
  SaveAllVehicles: typeof OxVehicle.saveAll;
  GetCharIdFromStateId: typeof GetCharIdFromStateId;
  GenerateVehicleVin: (model: string) => Promise<string>;
  GenerateVehiclePlate: typeof OxVehicle.generatePlate;
  SetGroupPermission: typeof SetGroupPermission;
  RemoveGroupPermission: typeof RemoveGroupPermission;
}

export const Ox = OxCore as OxServer;

export * from './player';
export * from './vehicle';
