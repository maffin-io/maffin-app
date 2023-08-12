import Money from '@/book/Money';

export type AccountsMap = { [guid: string]: Account };

export type AccountsTree = {
  account: Account,
  leaves: AccountsTree[],
};
