import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import { useAccountsTotals } from '@/hooks/api';
import { Account } from '@/book/entities';
import * as queries from '@/lib/queries/getMonthlyTotals';
import type { PriceDBMap } from '@/book/prices';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries/getMonthlyTotals');
jest.mock('@/hooks/api/useAccounts');
jest.mock('@/hooks/api/usePrices');

describe('useAccount', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid',
    } as Account;
    // @ts-ignore
    jest.spyOn(Account, 'findOneBy').mockResolvedValue(account);

    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<PriceDBMap>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query with enabled false when no accounts', async () => {
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {} as PriceDBMap,
    } as query.UseQueryResult<PriceDBMap>);

    renderHook(() => useAccountsTotals());

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query with enabled false when no prices', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
    } as query.UseQueryResult<Account[]>);

    renderHook(() => useAccountsTotals());

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query as expected', async () => {
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [] as Account[],
      dataUpdatedAt: 1,
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {} as PriceDBMap,
      dataUpdatedAt: 2,
    } as query.UseQueryResult<PriceDBMap>);
    renderHook(() => useAccountsTotals());

    expect(query.useQuery).toBeCalledWith({
      queryKey: [
        'api', 'aggregations', 'accounts', 'totals',
        {
          accountsUpdatedAt: 1,
          pricesUpdatedAt: 2,
        },
      ],
      queryFn: expect.any(Function),
      enabled: true,
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.default).toBeCalledWith([], {});
  });
});
