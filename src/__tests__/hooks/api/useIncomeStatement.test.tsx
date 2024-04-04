import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Interval } from 'luxon';
import {
  DefinedUseQueryResult,
  QueryClientProvider,
  UseQueryResult,
} from '@tanstack/react-query';

import { useIncomeStatement } from '@/hooks/api';
import { Account } from '@/book/entities';
import * as stateHooks from '@/hooks/state';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as queries from '@/lib/queries';
import * as aggregations from '@/helpers/accountsTotalAggregations';
import Money from '@/book/Money';
import { PriceDBMap } from '@/book/prices';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/lib/queries');
jest.mock('@/hooks/api/useAccounts', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useAccounts'),
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

describe('useIncomeStatement', () => {
  beforeEach(() => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
      type_income: new Money(0, 'EUR'),
    } as AccountsTotals);
    jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
      type_income: new Money(0, 'EUR'),
    } as AccountsTotals);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('is pending when no accounts/prices', async () => {
    const { result } = renderHook(
      () => useIncomeStatement(TEST_INTERVAL),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', { aggregation: 'income-statement', interval: TEST_INTERVAL.toISODate() }],
    );
    expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
  });

  it('calls query as expected', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(
      () => useIncomeStatement(TEST_INTERVAL),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'splits',
        {
          aggregation: 'income-statement',
          interval: TEST_INTERVAL.toISODate(),
          accountsUpdatedAt: 1,
        }],
    );

    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(queries.getAccountsTotals).toBeCalledWith([], TEST_INTERVAL);
    expect(result.current.data?.type_income.toString()).toEqual('0 EUR');
    expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
      ['type_income', 'type_expense'],
      [],
      expect.any(PriceDBMap),
      TEST_INTERVAL.end,
      { type_income: expect.any(Money) },
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
      () => useIncomeStatement(TEST_INTERVAL),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(queries.getAccountsTotals).toBeCalledWith(
      [{ type: 'EXPENSE' }, { type: 'INCOME' }],
      TEST_INTERVAL,
    );
  });

  it('uses alternative select', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const mockSelect = jest.fn();
    const { result } = renderHook(
      () => useIncomeStatement(TEST_INTERVAL, mockSelect),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
    expect(mockSelect).toBeCalledWith({ type_income: expect.any(Money) });
  });
});
