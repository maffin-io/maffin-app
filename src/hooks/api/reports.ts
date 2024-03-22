import React from 'react';
import {
  useQuery,
} from '@tanstack/react-query';
import { DateTime, Interval } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import { Split } from '@/book/entities';
import { getAccountsTotals } from '@/lib/queries';
import { isAsset, isLiability } from '@/book/helpers';
import type { AccountsTotals } from '@/types/book';
import type { Account } from '@/book/entities';
import type { PriceDBMap } from '@/book/prices';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
import fetcher from './fetcher';

/**
 * Calculates the balance sheet for all asset/liability/equity accounts
 * at a given point in time.
 */
export function useBalanceSheet(
  selectedDate: DateTime = DateTime.now(),
  select?: (data: AccountsTotals) => AccountsTotals,
): UseQueryResult<AccountsTotals> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals) => aggregateChildrenTotals(
      ['type_asset', 'type_liability'],
      accounts as Account[],
      prices as PriceDBMap,
      selectedDate,
      data,
    )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, selectedDate.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'balance-sheet',
      date: selectedDate.toISODate(),
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => getAccountsTotals(
        (accounts as Account[]).filter(a => a.type !== 'INCOME' && a.type !== 'EXPENSE'),
        Interval.fromDateTimes(
          DateTime.fromISO('1970'),
          selectedDate,
        ),
      ),
      queryKey,
    ),
    enabled: !!accounts,
    select: select || aggregate,
    networkMode: 'always',
  });

  return result;
}

/**
 * Calculates the income statement for all income/expense accounts
 * in a given interval of time.
 */
export function useIEStatement(
  interval: Interval,
  select?: (data: AccountsTotals) => AccountsTotals,
): UseQueryResult<AccountsTotals> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals) => aggregateChildrenTotals(
      ['type_income', 'type_expense'],
      accounts as Account[],
      prices as PriceDBMap,
      interval.end as DateTime<true>,
      data,
    )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, interval.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'income-statement',
      interval: interval.toISODate(),
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => getAccountsTotals(
        (accounts as Account[]).filter(
          a => !isAsset(a) && !isLiability(a) && a.type !== 'EQUITY',
        ),
        interval,
      ),
      queryKey,
    ),
    enabled: !!accounts,
    select: select || aggregate,
    networkMode: 'always',
  });

  return result;
}

export function useAccountsTotals(
  interval: Interval,
  select?: (data: AccountsTotals) => AccountsTotals,
): UseQueryResult<AccountsTotals> {
  const { data: balanceSheet, dataUpdatedAt: bsUpdatedAt } = useBalanceSheet(
    interval.end as DateTime<true>,
    select,
  );
  const { data: incomeStatement, dataUpdatedAt: iesUpdatedAt } = useIEStatement(interval, select);

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
