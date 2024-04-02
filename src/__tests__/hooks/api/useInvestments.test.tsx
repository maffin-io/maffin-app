import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Interval } from 'luxon';
import { DefinedUseQueryResult, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries/getInvestments';
import * as useSplitsHook from '@/hooks/api/useSplits';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as useMainCurrencyHook from '@/hooks/api/useMainCurrency';
import * as stateHooks from '@/hooks/state';
import { Account, Commodity, Split } from '@/book/entities';

jest.mock('@/lib/queries/getInvestments');
jest.mock('@/hooks/api/useSplits');
jest.mock('@/hooks/api/useAccounts');
jest.mock('@/hooks/api/useMainCurrency');

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useInvestments', () => {
  beforeEach(() => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Account[]>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Commodity>);

    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('is pending when no accounts', async () => {
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: { guid: 'c_guid' },
    } as UseQueryResult<Commodity>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: [{ guid: 'split_guid' }],
      dataUpdatedAt: 2,
    } as UseQueryResult<Split[]>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments', { splitsUpdatedAt: 2 }],
    );
    expect(queries.getInvestments).not.toBeCalled();
  });

  it('is pending when no splits', async () => {
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: { guid: 'c_guid' },
    } as UseQueryResult<Commodity>);
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [{ guid: 'guid' }],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments', { accountsUpdatedAt: 1 }],
    );
    expect(queries.getInvestments).not.toBeCalled();
  });

  it('is pending when no mainCurrency', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [{ guid: 'guid' }],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: [{ guid: 'split_guid' }],
      dataUpdatedAt: 2,
    } as UseQueryResult<Split[]>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments', { accountsUpdatedAt: 1, splitsUpdatedAt: 2 }],
    );
    expect(queries.getInvestments).not.toBeCalled();
  });

  it('calls query as expected', async () => {
    const account1 = { guid: 'guid', type: 'INVESTMENT' };
    const account2 = { guid: 'guid', type: 'ASSET' };
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account1, account2],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const investments = [
      { account: account1, processSplits: jest.fn() as Function } as InvestmentAccount,
    ];
    jest.spyOn(queries, 'getInvestments').mockResolvedValue(investments);

    const splits = [{ guid: 'split_guid' }];
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
      dataUpdatedAt: 2,
    } as UseQueryResult<Split[]>);

    const mainCurrency = { guid: 'c_guid' };
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as UseQueryResult<Commodity>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual(investments);
    expect(result.current.data?.[0].processSplits).toBeCalledWith(TEST_INTERVAL.end);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments', { accountsUpdatedAt: 1, splitsUpdatedAt: 2 }],
    );

    expect(useMainCurrencyHook.useMainCurrency).toBeCalledWith();
    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(useSplitsHook.useSplits).toBeCalledWith({ type: 'INVESTMENT' });
    expect(queries.getInvestments).toBeCalledWith([account1], splits, mainCurrency);
  });
});

describe('useInvestment', () => {
  beforeEach(() => {
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: [{ guid: 'split_guid' }],
      dataUpdatedAt: 2,
    } as UseQueryResult<Split[]>);

    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: { guid: 'c_guid' },
    } as UseQueryResult<Commodity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('calls query as expected', async () => {
    const account1 = { guid: 'guid1', type: 'INVESTMENT' };
    const account2 = { guid: 'guid', type: 'ASSET' };
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account1, account2],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);

    const investments = [
      { account: account1, processSplits: jest.fn() as Function } as InvestmentAccount,
    ];
    jest.spyOn(queries, 'getInvestments').mockResolvedValue(investments);

    const { result } = renderHook(() => useInvestment('guid1'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual(investments[0]);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments', { accountsUpdatedAt: 1, splitsUpdatedAt: 2 }],
    );

    expect(result.current.data?.processSplits).toBeCalledWith(TEST_INTERVAL.end);
  });

  it('returns undefined when account not found', async () => {
    const { result } = renderHook(() => useInvestment('unknown'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual(undefined);
  });
});
