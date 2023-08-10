import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';
import type { Fetcher, SWRResponse } from 'swr';

import { Commodity } from '@/book/entities';
import { useApi } from '@/hooks';
import * as queries from '@/lib/queries';
import { PriceDB } from '@/book/prices';
import getUser from '@/lib/getUser';

jest.mock('swr/immutable');
jest.mock('@/lib/queries');

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
    jest.spyOn(swrImmutable, 'default').mockImplementation(
      // @ts-ignore
      (key, f: Fetcher, args): SWRResponse => f(),
    );
    renderHook(() => useApi('/api/accounts'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/accounts',
      expect.any(Function),
      undefined,
    );
    expect(queries.getAccounts).toBeCalled();
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
