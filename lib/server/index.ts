import type { OxVehicle } from 'server/vehicle/class';
import type {
  GetAccountById,
  GetPlayerAccounts,
  GetCharacterAccounts,
  GetGroupAccounts,
  AddAccountBalance,
  RemoveAccountBalance,
  TransferAccountBalance,
  CreateAccount,
  CreateGroupAccount,
} from 'server/accounts';
import type { OxPlayer } from 'server/player/class';
import type { CreateVehicle, SpawnVehicle } from 'server/vehicle';
import type { GetTopVehicleStats, GetVehicleData } from 'common/vehicles';
import type { GetCharIdFromStateId } from 'server/player/db';

interface OxServer {
  [exportKey: string]: Function;
  GetAccountById: typeof GetAccountById;
  GetPlayerAccounts: typeof GetPlayerAccounts;
  GetCharacterAccounts: typeof GetCharacterAccounts;
  GetGroupAccounts: typeof GetGroupAccounts;
  AddAccountBalance: typeof AddAccountBalance;
  RemoveAccountBalance: typeof RemoveAccountBalance;
  TransferAccountBalance: typeof TransferAccountBalance;
  CreateAccount: typeof CreateAccount;
  CreateGroupAccount: typeof CreateGroupAccount;
  SaveAllPlayers: typeof OxPlayer.saveAll;
  SaveAllVehicles: typeof OxVehicle.saveAll;
  CreateVehicle: typeof CreateVehicle;
  SpawnVehicle: typeof SpawnVehicle;
  GetTopVehicleStats: typeof GetTopVehicleStats;
  GetVehicleData: typeof GetVehicleData;
  GetCharIdFromStateId: typeof GetCharIdFromStateId;
}

export const Ox: OxServer = exports.ox_core as any;

export * from './player';
export * from './vehicle';
