import React from 'react';
import { Interval } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
import { useInterval } from '@/hooks/state';
import { getMonthlyTotals } from '@/lib/queries';
import { intervalToDates } from '@/helpers/dates';
import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import type { AccountsTotals } from '@/types/book';
import type { Account } from '@/book/entities';
import type { PriceDBMap } from '@/book/prices';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
import fetcher from './fetcher';

/**
 * Aggregates monthly splits for each account to produce
 * monthly histograms of transactions. For accounts where their children
 * have different commodity, the monthly aggregation is converted using an
 * exchange rate for that month
 */
export function useMonthlyTotals(
  selectedInterval?: Interval,
): UseQueryResult<AccountsTotals[]> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = intervalToDates(interval);
      return data.map((d, i) => aggregateChildrenTotals(
        ['type_income', 'type_expense', 'type_asset', 'type_liability'],
        accounts as Account[],
        prices as PriceDBMap,
        dates[i],
        d,
      ));
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, interval.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'monthly-total',
      interval: interval.toISODate(),
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        interval,
      ),
      queryKey,
    ),
    enabled: !!accounts,
    select: aggregate,
    networkMode: 'always',
  });

  return result;
}
