import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';
import { SWRResponse } from 'swr';

import { Commodity } from '@/book/entities';
import { useApi } from '@/hooks';
import * as queries from '@/lib/queries';
import { PriceDB } from '@/book/prices';
import type { ApiPaths } from '@/hooks/useApi';
import getUser from '@/lib/getUser';

jest.mock('swr/immutable', () => ({
  __esModule: true,
  default: jest.fn((key, f: Function) => ({
    data: f(key),
    error: undefined,
  })),
}));
jest.mock('@/lib/queries');

describe('useApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('works for null key', async () => {
    renderHook(() => useApi(null));

    expect(swrImmutable.default).toBeCalledWith(
      null,
      expect.any(Function),
      undefined,
    );
  });

  it.each([
    ['/api/start-date', queries.getEarliestDate],
    ['/api/main-currency', queries.getMainCurrency],
    ['/api/commodities', jest.spyOn(Commodity, 'find').mockImplementation()],
    ['/api/accounts', queries.getAccounts],
    ['/api/accounts/monthly-totals', queries.getMonthlyTotals],
    ['/api/investments', queries.getInvestments],
    ['/api/txs/latest', queries.getLatestTxs],
  ])('calls %s with expected params', (key, f) => {
    renderHook(() => useApi(key as ApiPaths));

    expect(swrImmutable.default).toBeCalledWith(
      key,
      expect.any(Function),
      undefined,
    );

    expect(f).toBeCalledTimes(1);
  });

  it('calls /api/splits/<guid> with expected params', async () => {
    renderHook(() => useApi('/api/splits/account-guid'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/splits/account-guid',
      expect.any(Function),
      undefined,
    );

    expect(queries.getSplits).toBeCalledWith('account-guid');
  });

  it('calls /api/prices/today with expected params', async () => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({} as SWRResponse);
    renderHook(() => useApi('/api/prices/today'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/prices/today',
      PriceDB.getTodayQuotes,
      undefined,
    );
  });

  it('calls /api/user with expected params', async () => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({} as SWRResponse);
    renderHook(() => useApi('/api/user'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/user',
      getUser,
      {
        refreshInterval: 100000,
        revalidateOnMount: true,
      },
    );
  });

  it('propagates error', async () => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({ error: 'hello' } as SWRResponse);
    expect(() => useApi(null)).toThrow('hello');
  });
});
