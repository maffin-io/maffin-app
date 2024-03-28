import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries/getInvestments';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as useMainCurrencyHook from '@/hooks/api/useMainCurrency';
import type { Account, Commodity } from '@/book/entities';

jest.mock('@/lib/queries/getInvestments');
jest.mock('@/hooks/api/useAccounts');
jest.mock('@/hooks/api/useMainCurrency');

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useInvestments', () => {
  let investment: InvestmentAccount;

  beforeEach(() => {
    investment = {
      account: {
        guid: 'guid',
      } as Account,
    } as InvestmentAccount;

    jest.spyOn(queries, 'initInvestment').mockResolvedValue(investment);

    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Account[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Commodity>);
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
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([
      { account: account1 } as InvestmentAccount,
      { account: account2 } as InvestmentAccount,
    ]);

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

    expect(useMainCurrencyHook.useMainCurrency).toBeCalledWith();
    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(queries.getInvestments).toBeCalledWith([account1], mainCurrency);
  });
});

describe('useInvestment', () => {
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    account1 = {
      guid: 'guid1',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['guid2'],
    } as Account;
    account2 = {
      guid: 'guid2',
      name: 'Assets',
      childrenIds: [] as string[],
      parentId: 'guid1',
    } as Account;
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account1, account2],
    } as UseQueryResult<Account[]>);
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([
      { account: account1 } as InvestmentAccount,
      { account: account2 } as InvestmentAccount,
    ]);

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
    const { result } = renderHook(() => useInvestment('guid1'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual({ account: account1 });

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'investments']);
  });

  it('returns undefined when account not found', async () => {
    const { result } = renderHook(() => useInvestment('unknown'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual(undefined);
  });
});
