import React from 'react';
import { DateTime, Interval } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useInterval } from '@/hooks/state';
import { aggregateChildrenTotals, aggregateMonthlyWorth } from '@/helpers/accountsTotalAggregations';
import monthlyDates from '@/helpers/monthlyDates';
import { getMonthlyTotals } from '@/lib/queries';
import { Split } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';
import type { Account } from '@/book/entities';
import { useBalanceSheet } from './useBalanceSheet';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
import fetcher from './fetcher';

/**
 * Aggregates monthly splits for each account accumulating the value for each month.
 * This is useful to produce monthly worth histograms.
 *
 * For accounts where their children
 * have different commodity, the monthly aggregation is converted using an
 * exchange rate for each respective month
 */
export function useMonthlyWorth(
  selectedInterval?: Interval,
): UseQueryResult<AccountsTotals[]> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});
  const { data: totals, dataUpdatedAt: totalsUpdatedAt } = useBalanceSheet(
    interval.start?.endOf('month') as DateTime<true>,
    (data) => data,
  );

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = monthlyDates(interval as Interval).map(d => d.endOf('month'));
      dates[dates.length - 1] = (interval as Interval).end as DateTime;
      const aggregated = aggregateMonthlyWorth(
        ['type_asset', 'type_liability'],
        accounts as Account[],
        [
          totals as AccountsTotals,
          ...data,
        ],
        dates,
      );

      return aggregated.map((d, i) => aggregateChildrenTotals(
        ['type_asset', 'type_liability'],
        accounts as Account[],
        prices as PriceDBMap,
        dates[i],
        d,
      ));
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, totalsUpdatedAt, interval.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'monthly-worth',
      interval: interval.toISODate(),
      totalsUpdatedAt,
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        Interval.fromDateTimes(
          ((interval as Interval).start as DateTime).plus({ month: 1 }),
          (interval as Interval).end as DateTime,
        ),
      ),
      queryKey,
    ),
    enabled: !!accounts && !!totalsUpdatedAt,
    select: aggregate,
    networkMode: 'always',
  });

  return result;
}
