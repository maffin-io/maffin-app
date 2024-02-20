import Money from '@/book/Money';

export type AccountsMap = { [guid: string]: Account };

export type AccountsTree = {
  account: Account,
  leaves: AccountsTree[],
};

export type AccountsTotals = {
  [guid: string]: Money;
};

export type AccountsMonthlyTotals = {
  [guid: string]: {
    [yearMonth: string]: Money,
  },
};
