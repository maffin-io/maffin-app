import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

export type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};

export default function getAccountsTree(
  current: Account,
  accounts: AccountsMap,
  accountsTotal: { [guid: string]: Money },
): AccountsTableRow {
  const leaves: AccountsTableRow[] = [];
  current.childrenIds.forEach(childId => {
    const childAccount = accounts[childId];
    if (!childAccount.hidden && childAccount.parentId === current.guid) {
      leaves.push(getAccountsTree(childAccount, accounts, accountsTotal));
    }
  });

  const accountTotal = accountsTotal[current.guid] || new Money(0, current.commodity?.mnemonic || '');

  return {
    account: current,
    total: accountTotal,
    leaves,
  };
}
