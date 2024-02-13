import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Returns the passed accounts in a map where the key
 * is the account guid.
 *
 * For first level accounts, the key is also the type of the account prefixed
 * with type, same for the root account.
 */
export default function mapAccounts(accounts: Account[] | undefined): AccountsMap {
  if (!accounts || accounts.length === 0) {
    return { type_root: { childrenIds: [] } };
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
