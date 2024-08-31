import { CreateNewAccount, SelectDefaultAccountId, UpdateInvoice, DeleteInvoice } from './db';
import { GetCharIdFromStateId } from 'player/db';
import { OxAccount } from './class';

setInterval(() => {
  const accounts = OxAccount.getAll();

  for (const accountId in accounts) {
    const account = accounts[accountId];

    OxAccount.remove(account.accountId);
  }
}, 60000);

/**
 * Return the default account for a character.
 * @param id The charId or stateId used to identify the character.
 */
export async function GetCharacterAccount(id: number | string) {
  const charId = typeof id === 'string' ? await GetCharIdFromStateId(id) : id;
  const accountId = charId && (await SelectDefaultAccountId('owner', charId));
  return accountId ? OxAccount.get(accountId) : null;
}

/**
 * Return the default account for a group.
 */
export async function GetGroupAccount(groupName: string) {
  const accountId = await SelectDefaultAccountId('group', groupName);
  return accountId ? OxAccount.get(accountId) : null;
}

export async function CreateAccount(owner: number | string, label: string) {
  const accountId = await CreateNewAccount(owner, label);
  return OxAccount.get(accountId);
}

export function PayAccountInvoice(invoiceId: number, charId: number) {
  return UpdateInvoice(invoiceId, charId);
}

export function DeleteAccountInvoice(invoiceId: number) {
  return DeleteInvoice(invoiceId);
}

exports('GetCharacterAccount', GetCharacterAccount);
exports('GetGroupAccount', GetGroupAccount);
exports('CreateAccount', CreateAccount);
exports('PayAccountInvoice', PayAccountInvoice);
