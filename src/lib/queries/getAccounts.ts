import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Retrieves all the accounts and returns them in a map where the key
 * is the account guid.
 *
 * For first level accounts, the key is also the type of the account prefixed
 * with type, same for the root account.
 *
 * If a guid is passed, we return that account instead
 */
export default async function getAccounts(guid?: string): Promise<AccountsMap> {
  const accounts = await Account.findBy({ guid });

  if (guid) {
    return accounts[0];
  }

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
