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
} from '../../server/accounts';
import type { OxPlayer } from '../../server/player/class';

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
  GetPlayer: typeof OxPlayer.get;
  GetPlayers: typeof OxPlayer.getAll;
  SaveAllPlayers: typeof OxPlayer.saveAll;
}

export const Ox: OxServer = exports.ox_core as any;

export * from './player';
