import Money from '@/book/Money';

export type AccountsTree = {
  account: Account,
  total: Money, // Total including the children totals
  children: AccountsTree[],
};
