import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';

import { Commodity } from '@/book/entities';
import { PriceDB, PriceDBMap } from '@/book/prices';
import * as API from '@/hooks/api';
import * as queries from '@/lib/queries';
import * as gapiHooks from '@/hooks/useGapiClient';
import * as getUserModule from '@/lib/getUser';
import { BareFetcher, SWRResponse } from 'swr';

jest.mock('@/lib/queries');

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
  PriceDB: {
    getTodayQuotes: jest.fn(),
  },
}));

jest.mock('@/lib/getUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('swr/immutable', () => ({
  __esModule: true,
  ...jest.requireActual('swr/immutable'),
}));

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

describe('API', () => {
  beforeEach(() => {
    jest.spyOn(Commodity, 'find').mockImplementation();
    jest.spyOn(PriceDB, 'getTodayQuotes').mockImplementation();
    jest.spyOn(getUserModule, 'default').mockImplementation();
    jest.spyOn(swrImmutable, 'default').mockImplementation(
      jest.fn((key, f: BareFetcher | null) => ({
        data: f && f(key),
        error: undefined,
      } as SWRResponse)),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['useStartDate', '/api/start-date', queries.getEarliestDate],
    ['useMainCurrency', '/api/main-currency', queries.getMainCurrency],
    ['useCommodities', '/api/commodities', jest.spyOn(Commodity, 'find')],
    ['useLatestTxs', '/api/txs/latest', queries.getLatestTxs],
    ['useAccounts', '/api/accounts', queries.getAccounts],
    ['useInvestments', '/api/investments', queries.getInvestments],
    ['useTodayPrices', '/api/prices/today', jest.spyOn(PriceDB, 'getTodayQuotes')],
  ])('calls useSWRImmutable with expected params for %s', (name, key, f) => {
    // @ts-ignore
    renderHook(() => API[name]());

    expect(swrImmutable.default).toBeCalledWith(
      key,
      expect.any(Function),
    );

    expect(f).toBeCalledTimes(1);
  });

  it.each([
    'useInvestments',
  ])('propagates error for %s', (name) => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({ error: 'error' } as SWRResponse);
    // @ts-ignore
    renderHook(() => expect(() => API[name]()).toThrow('error'));
  });

  it('calls useSWRImmutable with expected params for useSplits', () => {
    renderHook(() => API.useSplits('guid'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/splits/guid',
      expect.any(Function),
    );

    expect(queries.getSplits).toBeCalledTimes(1);
    expect(queries.getSplits).toBeCalledWith('guid');
  });

  it('calls useSWRImmutable with null key for useAccountsMonthlyTotals when no accounts', () => {
    jest.spyOn(swrImmutable, 'default').mockReturnValueOnce({ data: undefined } as SWRResponse);
    renderHook(() => API.useAccountsMonthlyTotals());

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      1,
      '/api/accounts',
      expect.any(Function),
    );

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      2,
      '/api/prices/today',
      expect.any(Function),
    );

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      3,
      null,
      expect.any(Function),
    );
  });

  it('calls useSWRImmutable with null key for useAccountsMonthlyTotals when no prices', () => {
    const accounts = { a: { guid: 'a' } };
    jest.spyOn(swrImmutable, 'default')
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: undefined } as SWRResponse);
    renderHook(() => API.useAccountsMonthlyTotals());

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      1,
      '/api/accounts',
      expect.any(Function),
    );

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      2,
      '/api/prices/today',
      expect.any(Function),
    );

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      3,
      null,
      expect.any(Function),
    );
  });

  it('calls useSWRImmutable with expected params for useAccountsMonthlyTotals when accounts and prices', () => {
    const accounts = { a: { guid: 'a' } };
    const todayPrices = new PriceDBMap();
    jest.spyOn(swrImmutable, 'default')
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayPrices } as SWRResponse);
    renderHook(() => API.useAccountsMonthlyTotals());

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      3,
      ['/api/accounts/monthly-totals', ['a'], []],
      expect.any(Function),
    );
    expect(queries.getMonthlyTotals).toBeCalledWith(accounts, todayPrices);
  });

  it('calls useSWRImmutable with null key for useUser when no gapi', () => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);
    renderHook(() => API.useUser());

    expect(swrImmutable.default).toBeCalledWith(
      null,
      expect.any(Function),
      { refreshInterval: 100000, revalidateOnMount: true },
    );
  });

  it('calls useSWRImmutable with expected params for useUser when gapi', () => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    renderHook(() => API.useUser());

    expect(swrImmutable.default).toBeCalledWith(
      '/api/user',
      expect.any(Function),
      { refreshInterval: 100000, revalidateOnMount: true },
    );

    expect(getUserModule.default).toBeCalledTimes(1);
  });
});
