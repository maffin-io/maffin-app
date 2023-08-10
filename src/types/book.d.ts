import Money from '@/book/Money';

export type AccountsMap = { [guid: string]: Account };

export type AccountsTree = {
  account: Account,
  total: Money, // Total including the children totals
  monthlyTotals: { [key: string]: Money },
  children: AccountsTree[],
};
