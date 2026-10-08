import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import { isAsset, isLiability } from '@/book/helpers/accountType';
import mapAccounts from '@/helpers/mapAccounts';

export function isReportAccount(account: Account | undefined): boolean {
  return account?.report !== false;
}

export function isIncomeOrExpense(account: Account | undefined): boolean {
  return account?.type === 'INCOME' || account?.type === 'EXPENSE';
}

/**
 * Whether the account appears in the dashboard accounts tree.
 * - hidden accounts are never shown
 * - asset/liability accounts with report=false are not shown
 * - income/expense accounts are shown even when report=false
 */
export function isVisibleInAccountsTree(account: Account | undefined): boolean {
  if (!account || account.hidden) {
    return false;
  }

  if (isAsset(account) || isLiability(account)) {
    return isReportAccount(account);
  }

  return true;
}

/**
 * Children that roll into parent totals on the dashboard.
 * Income/expense always count. Asset/liability only count when report is on.
 */
export function totalsChildIds(accounts: AccountsMap, parent: Account): string[] {
  return parent.childrenIds.filter(childId => {
    const child = accounts[childId];
    if (!child) {
      return false;
    }

    if (isIncomeOrExpense(child)) {
      return true;
    }

    return isReportAccount(child);
  });
}

/**
 * Children included in income/expense PDF reports.
 */
export function reportChildIds(accounts: AccountsMap, parent: Account): string[] {
  return parent.childrenIds.filter(childId => isReportAccount(accounts[childId]));
}

/**
 * Filters guids for chart series. Asset/liability accounts with report=false
 * are omitted unless explicitly included. Income/expense always pass through.
 */
export default function reportAccountGuids(
  guids: string[],
  accounts: Account[] | undefined,
  includeGuids: string[] = [],
): string[] {
  if (!accounts) {
    return guids;
  }

  const includeSet = new Set(includeGuids);
  const accountsMap = mapAccounts(accounts);
  return guids.filter(guid => {
    if (includeSet.has(guid)) {
      return true;
    }

    const account = accountsMap[guid];
    if (isIncomeOrExpense(account)) {
      return true;
    }

    return isReportAccount(account);
  });
}
