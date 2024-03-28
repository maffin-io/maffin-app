import { DateTime, Interval } from 'luxon';

import type { AccountsTotals } from '@/types/book';
import { useInterval } from '../state';
import { useBalanceSheet } from './useBalanceSheet';
import { useIncomeStatement } from './useIncomeStatement';

/**
 * This is a utility function that returns the balance sheet
 * and the income statement all together. Useful when you want to retrieve
 * the totals for all the accounts (which some are assets/liabilities and
 * others are income/expenses).
 */
export function useAccountsTotals(
  selectedInterval?: Interval,
  select?: (data: AccountsTotals) => AccountsTotals,
): { data: AccountsTotals } {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const { data: balanceSheet } = useBalanceSheet(
    interval.end as DateTime<true>,
    select,
  );
  const { data: incomeStatement } = useIncomeStatement(interval, select);

  return {
    data: { ...balanceSheet, ...incomeStatement },
  };
}
