import type { Account } from '@/book/entities';
import type { AccountsTree, AccountsMap } from '@/types/book';

/**
 * This function recursively goes through all the accounts so it builds the
 * accounts tree.
 */
export default function getAccountsTree(
  root: Account,
  accounts: AccountsMap,
): AccountsTree {
  const leaves = root.childrenIds.map(
    childId => getAccountsTree(accounts[childId], accounts),
  );

  return {
    account: root,
    leaves,
  };
}
