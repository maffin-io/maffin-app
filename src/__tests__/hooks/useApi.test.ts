import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';

import { Commodity } from '@/book/entities';
import { useApi } from '@/hooks';
import * as queries from '@/book/queries';
import * as q from '@/lib/queries';
import { PriceDB } from '@/book/prices';
import getUser from '@/lib/getUser';

jest.mock('swr/immutable');

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

describe('useApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('works for null key', async () => {
    renderHook(() => useApi(null));

    expect(swrImmutable.default).toBeCalledWith(
      null,
      expect.any(Function),
      undefined,
    );
  });

  it('calls /api/start-date with expected params', async () => {
    renderHook(() => useApi('/api/start-date'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/start-date',
      queries.getEarliestDate,
      undefined,
    );
  });

  it('calls /api/main-currency with expected params', async () => {
    renderHook(() => useApi('/api/main-currency'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/main-currency',
      queries.getMainCurrency,
      undefined,
    );
  });

  it('calls /api/commodities with expected params', async () => {
    renderHook(() => useApi('/api/commodities'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/commodities',
      Commodity.find,
      undefined,
    );
  });

  it('calls /api/accounts with expected params', async () => {
    renderHook(() => useApi('/api/accounts'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/accounts',
      q.getAccounts,
      undefined,
    );
  });

  it('calls /api/investments with expected params', async () => {
    renderHook(() => useApi('/api/investments'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/investments',
      queries.getInvestments,
      undefined,
    );
  });

  it('calls /api/prices/today with expected params', async () => {
    renderHook(() => useApi('/api/prices/today'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/prices/today',
      PriceDB.getTodayQuotes,
      undefined,
    );
  });

  it('calls /api/splits/<guid> with expected params', async () => {
    jest.spyOn(queries, 'getSplits').mockImplementation();
    renderHook(() => useApi('/api/splits/<guid>', { guid: '1234-5678' }));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/splits/1234-5678',
      expect.any(Function),
      undefined,
    );
    (swrImmutable.default as jest.Mock).mock.calls[0][1]();
    expect(queries.getSplits).toBeCalledWith('1234-5678');
  });

  it('calls /api/user with expected params', async () => {
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
});
