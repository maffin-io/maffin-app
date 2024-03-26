import React from 'react';
import { DateTime, Interval } from 'luxon';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import type { AccountsTotals } from '@/types/book';
import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import type { PriceDBMap } from '@/book/prices';
import { getAccountsTotals } from '@/lib/queries';
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
