import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Interval } from 'luxon';
import { DefinedUseQueryResult, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries/getInvestments';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as useMainCurrencyHook from '@/hooks/api/useMainCurrency';
import * as stateHooks from '@/hooks/state';
import type { Account, Commodity } from '@/book/entities';

jest.mock('@/lib/queries/getInvestments');
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
    const mainCurrency = { guid: 'c_guid' };
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as UseQueryResult<Commodity>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments'],
    );
    expect(queries.getInvestments).not.toBeCalled();
  });

  it('is pending when no mainCurrency', async () => {
    const account = { guid: 'guid' };
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account],
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(() => useInvestments(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'investments'],
    );
    expect(queries.getInvestments).not.toBeCalled();
  });

  it('calls query as expected', async () => {
    const account1 = { guid: 'guid', type: 'INVESTMENT' };
    const account2 = { guid: 'guid', type: 'ASSET' };
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account1, account2],
    } as UseQueryResult<Account[]>);

    const investments = [
      { account: account1, processSplits: jest.fn() as Function } as InvestmentAccount,
    ];
    jest.spyOn(queries, 'getInvestments').mockResolvedValue(investments);

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
      ['api', 'investments'],
    );

    expect(useMainCurrencyHook.useMainCurrency).toBeCalledWith();
    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(queries.getInvestments).toBeCalledWith([account1], mainCurrency);
  });
});

describe('useInvestment', () => {
  beforeEach(() => {
    const mainCurrency = { guid: 'c_guid' };
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
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
    expect(queryCache[0].queryKey).toEqual(['api', 'investments']);

    expect(result.current.data?.processSplits).toBeCalledWith(TEST_INTERVAL.end);
  });

  it('returns undefined when account not found', async () => {
    const { result } = renderHook(() => useInvestment('unknown'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual(undefined);
  });
});
