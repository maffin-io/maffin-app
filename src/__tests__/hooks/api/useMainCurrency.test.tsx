import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';

import { useMainCurrency } from '@/hooks/api';
import * as queries from '@/lib/queries';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import type { Account, Commodity } from '@/book/entities';

jest.mock('@/lib/queries');
jest.mock('@/hooks/api/useAccounts', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useAccounts'),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useMainCurrency', () => {
  it('is disabled when no main assets account', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as UseQueryResult<Account[]>);
    renderHook(() => useMainCurrency(), { wrapper });

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    // @ts-ignore
    expect(queryCache[0].options.enabled).toBe(false);
    expect(queryCache[0].queryKey).toEqual(['api', 'commodities', { guid: 'main' }]);
  });

  it('calls query as expected when asset account available', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: { guid: 'assets' } as Account,
    } as UseQueryResult<Account>);

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      guid: 'eur',
    } as Commodity);

    const { result } = renderHook(() => useMainCurrency(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ guid: 'eur' }));
    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    // @ts-ignore
    expect(queryCache[0].options.enabled).toBe(true);
    expect(queryCache[0].queryKey).toEqual(['api', 'commodities', { guid: 'main' }]);
  });
});
