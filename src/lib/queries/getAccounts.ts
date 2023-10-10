import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Retrieves all the accounts and returns them in a map where the key
 * is the account guid.
 *
 * For first level accounts, the key is also the type of the account. For
 * example the root account can be found in `accounts.root`, the assets one
 * in `accounts.asset`.
 */
export default async function getAccounts(): Promise<AccountsMap> {
  const accounts = await Account.find();

  const accountsMap: AccountsMap = {};
  accounts.forEach(account => {
    if (account.type === 'ROOT' && !account.name.startsWith('Template')) {
      accountsMap.root = account;
    }

    if (account.type !== 'ROOT') {
      accountsMap[account.guid] = account;
    }
  });

  accounts.forEach(account => {
    if (account.parentId === accountsMap.root.guid) {
      accountsMap[`type_${account.type.toLowerCase()}`] = account;
    }
  });

  return accountsMap;
}
