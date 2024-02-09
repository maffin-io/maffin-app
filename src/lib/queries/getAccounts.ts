import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Retrieves all the accounts and returns them in a map where the key
 * is the account guid.
 *
 * For first level accounts, the key is also the type of the account prefixed
 * with type, same for the root account.
 */
export async function getAccounts(): Promise<AccountsMap> {
  const accounts = await Account.find();

  const accountsMap: AccountsMap = {};
  accounts.forEach(account => {
    if (account.type === 'ROOT' && !account.name.startsWith('Template')) {
      accountsMap.type_root = account;
    }

    accountsMap[account.guid] = account;
  });

  accounts.forEach(account => {
    if (account.parentId === accountsMap.type_root.guid) {
      accountsMap[`type_${account.type.toLowerCase()}`] = account;
    }
  });

  return accountsMap;
}

export async function getAccount(guid: string): Promise<Account | null> {
  const account = await Account.findOneBy({ guid });
  return account;
}
