import React from 'react';
import { Interval } from 'luxon';
import type { DateTime } from 'luxon';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { useInterval } from '@/hooks/state';
import type { AccountsTotals } from '@/types/book';
import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';
import { getAccountsTotals } from '@/lib/queries';
import { isAsset, isLiability } from '@/book/helpers';
import { useAccounts } from './useAccounts';
import fetcher from './fetcher';

/**
 * Calculates the income statement for all income/expense accounts
 * in a given interval of time.
 */
export function useIncomeStatement(
  selectedInterval?: Interval,
  select?: (data: AccountsTotals) => AccountsTotals,
): UseQueryResult<AccountsTotals> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();

  const aggregate = React.useCallback(
    ((data: AccountsTotals) => aggregateChildrenTotals(
      ['type_income', 'type_expense'],
      accounts as Account[],
      new PriceDBMap(),
      interval.end as DateTime<true>,
      data,
    )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, interval.toISODate()],
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
