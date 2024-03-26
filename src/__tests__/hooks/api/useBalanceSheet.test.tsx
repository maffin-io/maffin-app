import React from 'react';
import { DateTime, Interval } from 'luxon';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';

import { useBalanceSheet } from '@/hooks/api';
import { Account } from '@/book/entities';
import type { PriceDBMap } from '@/book/prices';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import * as queries from '@/lib/queries';
import * as aggregations from '@/helpers/accountsTotalAggregations';
import Money from '@/book/Money';
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

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useBalanceSheet', () => {
  beforeEach(() => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({ data: {} } as UseQueryResult<PriceDBMap>);
    jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
      type_asset: new Money(0, 'EUR'),
    } as AccountsTotals);
    jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
      type_asset: new Money(0, 'EUR'),
    } as AccountsTotals);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('is pending when no accounts/prices', async () => {
    const { result } = renderHook(
      () => useBalanceSheet(DateTime.fromISO('2023-01-01')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', { aggregation: 'balance-sheet', date: '2023-01-01' }],
    );
    expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
  });

  it('calls query as expected', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(
      () => useBalanceSheet(DateTime.fromISO('2023-01-01')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'splits',
        {
          aggregation: 'balance-sheet',
          date: '2023-01-01',
          accountsUpdatedAt: 1,
        }],
    );

    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(usePricesHook.usePrices).toBeCalledWith({});
    expect(queries.getAccountsTotals).toBeCalledWith(
      [],
      Interval.fromDateTimes(
        DateTime.fromISO('1970'),
        DateTime.fromISO('2023-01-01'),
      ),
    );
    expect(result.current.data?.type_asset.toString()).toEqual('0.00 EUR');
    expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
      ['type_asset', 'type_liability'],
      [],
      {},
      DateTime.now(),
      { type_asset: expect.any(Money) },
    );
  });

  it('filters INCOME and EXPENSE accounts', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [
        {
          type: 'EXPENSE',
        },
        {
          type: 'INCOME',
        },
        {
          type: 'ASSET',
        },
      ] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(
      () => useBalanceSheet(DateTime.fromISO('2023-01-01')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(queries.getAccountsTotals).toBeCalledWith(
      [{ type: 'ASSET' }],
      Interval.fromDateTimes(
        DateTime.fromISO('1970'),
        DateTime.fromISO('2023-01-01'),
      ),
    );
  });

  it('uses alternative select', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const mockSelect = jest.fn();
    const { result } = renderHook(
      () => useBalanceSheet(DateTime.fromISO('2023-01-01'), mockSelect),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
    expect(mockSelect).toBeCalledWith({ type_asset: expect.any(Money) });
  });
});
