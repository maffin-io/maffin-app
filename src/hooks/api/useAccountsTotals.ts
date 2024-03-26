import { DateTime, Interval } from 'luxon';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
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
): UseQueryResult<AccountsTotals> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const { data: balanceSheet, dataUpdatedAt: bsUpdatedAt } = useBalanceSheet(
    interval.end as DateTime<true>,
    select,
  );
  const {
    data: incomeStatement,
    dataUpdatedAt: iesUpdatedAt,
  } = useIncomeStatement(interval, select);

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'total',
      interval: interval.toISODate(),
      bsUpdatedAt,
      iesUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: () => ({ ...balanceSheet, ...incomeStatement }),
    enabled: !!balanceSheet && !!incomeStatement,
    networkMode: 'always',
  });

  return result;
}
