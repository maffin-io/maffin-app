import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import { isVisibleInAccountsTree } from '@/helpers/visibleAccountGuids';

export type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};

export type GetAccountsTreeOptions = {
  /**
   * Whether a child account should appear in the tree.
   * Defaults to dashboard visibility (hidden + asset/liability report).
   */
  shouldInclude?: (account: Account) => boolean,
};

export default function getAccountsTree(
  current: Account,
  accounts: AccountsMap,
  accountsTotal: { [guid: string]: Money },
  options: GetAccountsTreeOptions = {},
): AccountsTableRow {
  const { shouldInclude = isVisibleInAccountsTree } = options;
  const leaves: AccountsTableRow[] = [];
  current.childrenIds.forEach(childId => {
    const childAccount = accounts[childId];
    if (shouldInclude(childAccount) && childAccount.parentId === current.guid) {
      leaves.push(getAccountsTree(childAccount, accounts, accountsTotal, options));
    }
  });

  const accountTotal = accountsTotal[current.guid] || new Money(0, current.commodity?.mnemonic || '');

  return {
    account: current,
    total: accountTotal,
    leaves,
  };
}
