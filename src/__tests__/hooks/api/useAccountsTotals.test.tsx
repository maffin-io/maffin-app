import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import { useAccountsTotals } from '@/hooks/api';
import { Account } from '@/book/entities';
import * as queries from '@/lib/queries/getMonthlyTotals';
import type { PriceDBMap } from '@/book/prices';

jest.mock('@/lib/queries/getMonthlyTotals');
jest.mock('@/hooks/api/useAccounts');
jest.mock('@/hooks/api/usePrices');

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAccountsTotals', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid',
    } as Account;
    // @ts-ignore
    jest.spyOn(Account, 'findOneBy').mockResolvedValue(account);

    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: undefined,
    } as UseQueryResult<PriceDBMap>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('calls query with enabled false when no accounts', async () => {
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {} as PriceDBMap,
    } as UseQueryResult<PriceDBMap>);

    const { result } = renderHook(() => useAccountsTotals(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));
  });

  it('calls query with enabled false when no prices', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
    } as UseQueryResult<Account[]>);

    const { result } = renderHook(() => useAccountsTotals(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('pending'));
  });

  it('calls query as expected', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {} as PriceDBMap,
      dataUpdatedAt: 2,
    } as UseQueryResult<PriceDBMap>);
    jest.spyOn(queries, 'default').mockResolvedValue({});

    const { result } = renderHook(() => useAccountsTotals(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(queries.default).toBeCalledWith([], {});

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual([
      'api', 'aggregations', 'accounts', 'totals', { accountsUpdatedAt: 1, pricesUpdatedAt: 2 },
    ]);
  });
});
