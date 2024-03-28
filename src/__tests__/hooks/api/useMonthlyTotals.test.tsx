import React from 'react';
import { DateTime, Interval } from 'luxon';
import {
  QueryClientProvider,
  UseQueryResult,
  DefinedUseQueryResult,
} from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useMonthlyTotals } from '@/hooks/api/useMonthlyTotals';
import { Account } from '@/book/entities';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import * as queries from '@/lib/queries';
import * as stateHooks from '@/hooks/state';
import type { PriceDBMap } from '@/book/prices';
import Money from '@/book/Money';
import * as aggregations from '@/helpers/accountsTotalAggregations';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/lib/queries');
jest.mock('@/hooks/api/useAccounts', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useAccounts'),
}));
jest.mock('@/hooks/api/usePrices', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/usePrices'),
}));
jest.mock('@/helpers/accountsTotalAggregations', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/accountsTotalAggregations'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useMonthlyTotals', () => {
  beforeEach(() => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {},
    } as UseQueryResult<PriceDBMap>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);

    jest.spyOn(queries, 'getMonthlyTotals').mockResolvedValue([
      {
        type_asset: new Money(100, 'EUR'),
      },
      {
        type_asset: new Money(200, 'EUR'),
      },
    ] as AccountsTotals[]);
    jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
      type_asset: new Money(400, 'EUR'),
    } as AccountsTotals);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('is pending when no accounts', async () => {
    const { result } = renderHook(
      () => useMonthlyTotals(),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'splits',
        {
          aggregation: 'monthly-total',
          interval: TEST_INTERVAL.toISODate(),
        },
      ],
    );
  });

  it('calls query as expected', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const interval = Interval.fromDateTimes(
      DateTime.now().minus({ months: 10 }),
      DateTime.now().minus({ months: 8 }),
    );
    const { result } = renderHook(
      () => useMonthlyTotals(interval),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'splits',
        {
          aggregation: 'monthly-total',
          interval: interval.toISODate(),
          accountsUpdatedAt: 1,
        }],
    );

    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(usePricesHook.usePrices).toBeCalledWith({});
    expect(queries.getMonthlyTotals).toBeCalledWith([], interval);
    expect(result.current.data?.[0].type_asset.toString()).toEqual('400.00 EUR');

    expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
    expect(aggregations.aggregateChildrenTotals).nthCalledWith(
      1,
      ['type_income', 'type_expense', 'type_asset', 'type_liability'],
      [],
      {},
      interval.start?.endOf('month').startOf('day'),
      {
        type_asset: expect.any(Money),
      },
    );
    expect(aggregations.aggregateChildrenTotals).nthCalledWith(
      2,
      ['type_income', 'type_expense', 'type_asset', 'type_liability'],
      [],
      {},
      interval.start?.plus({ month: 1 }).endOf('month').startOf('day'),
      {
        type_asset: expect.any(Money),
      },
    );
  });
});
