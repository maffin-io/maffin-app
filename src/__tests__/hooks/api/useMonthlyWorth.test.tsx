import React from 'react';
import { DateTime, Interval } from 'luxon';
import {
  QueryClientProvider,
  UseQueryResult,
  DefinedUseQueryResult,
} from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useMonthlyWorth } from '@/hooks/api/useMonthlyWorth';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import * as balanceSheetHook from '@/hooks/api/useBalanceSheet';
import * as stateHooks from '@/hooks/state';
import * as queries from '@/lib/queries';
import * as aggregations from '@/helpers/accountsTotalAggregations';
import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import type { PriceDBMap } from '@/book/prices';
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

jest.mock('@/hooks/api/useBalanceSheet', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useBalanceSheet'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

jest.mock('@/helpers/accountsTotalAggregations', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/accountsTotalAggregations'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useMonthlyWorth', () => {
  beforeEach(() => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {},
    } as UseQueryResult<PriceDBMap>);
    jest.spyOn(balanceSheetHook, 'useBalanceSheet').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);

    jest.spyOn(queries, 'getMonthlyTotals').mockResolvedValue([
      {
        type_asset: new Money(200, 'EUR'),
      },
    ] as AccountsTotals[]);
    jest.spyOn(aggregations, 'aggregateMonthlyWorth').mockReturnValue([
      {
        type_asset: new Money(500, 'EUR'),
      },
      {
        type_asset: new Money(700, 'EUR'),
      },
    ] as AccountsTotals[]);
    jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
      type_asset: new Money(1000, 'EUR'),
    } as AccountsTotals);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('is pending when no accounts', async () => {
    const { result } = renderHook(
      () => useMonthlyWorth(),
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
          aggregation: 'monthly-worth',
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
    jest.spyOn(balanceSheetHook, 'useBalanceSheet').mockReturnValue({
      data: {
        type_asset: new Money(500, 'EUR'),
      } as AccountsTotals,
      dataUpdatedAt: 1,
    } as UseQueryResult<AccountsTotals>);
    jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
      type_asset: new Money(500, 'EUR'),
    } as AccountsTotals);

    const { result } = renderHook(
      () => useMonthlyWorth(),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'splits',
        {
          aggregation: 'monthly-worth',
          interval: TEST_INTERVAL.toISODate(),
          accountsUpdatedAt: 1,
          totalsUpdatedAt: 1,
        }],
    );

    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(usePricesHook.usePrices).toBeCalledWith({});
    expect(queries.getMonthlyTotals).toBeCalledWith(
      [],
      Interval.fromDateTimes(
        // +1 month because initial month is computed with useAccountsTotals
        (TEST_INTERVAL.start as DateTime).plus({ month: 1 }),
        TEST_INTERVAL.end as DateTime,
      ),
    );
    expect(result.current.data?.[0].type_asset.toString()).toEqual('1000.00 EUR');

    expect(aggregations.aggregateMonthlyWorth).toBeCalledTimes(1);
    expect(aggregations.aggregateMonthlyWorth).toBeCalledWith(
      ['type_asset', 'type_liability'],
      [],
      [
        {
          // The one from useBalanceSheet
          type_asset: expect.any(Money),
        },
        {
          type_asset: expect.any(Money),
        },
      ],
      [
        TEST_INTERVAL.start?.endOf('month'),
        expect.any(DateTime),
        expect.any(DateTime),
        expect.any(DateTime),
        expect.any(DateTime),
        TEST_INTERVAL.end,
      ],
    );
    expect(
      (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][0].type_asset.toString(),
    ).toEqual('500.00 EUR');
    expect(
      (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][1].type_asset.toString(),
    ).toEqual('200.00 EUR');

    expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
    expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
      ['type_asset', 'type_liability'],
      [],
      {},
      TEST_INTERVAL.start?.endOf('month'),
      {
        type_asset: expect.any(Money),
      },
    );
    expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
      ['type_asset', 'type_liability'],
      [],
      {},
      TEST_INTERVAL.start?.plus({ month: 1 }).endOf('month'),
      {
        type_asset: expect.any(Money),
      },
    );
  });
});
