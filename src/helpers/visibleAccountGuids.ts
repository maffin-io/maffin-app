import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

export function reportChildIds(accounts: AccountsMap, parent: Account): string[] {
  return parent.childrenIds.filter(childId => accounts[childId]?.report !== false);
}

export function isReportAccount(account: Account | undefined): boolean {
  return account?.report !== false;
}
