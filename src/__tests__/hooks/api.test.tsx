import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';

import { Commodity, Price } from '@/book/entities';
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

  it('calls useSWRImmutable with expected params for useAccountsMonthlyTotals', () => {
    const accounts = { a: { guid: 'a' } };
    const todayPrices = new PriceDBMap();
    jest.spyOn(swrImmutable, 'default')
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayPrices } as SWRResponse);
    renderHook(() => API.useAccountsMonthlyTotals());

    expect(swrImmutable.default).toHaveBeenNthCalledWith(
      3,
      '/api/monthly-totals',
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

  it('calls useSWRImmutable with expected params for usePrices', () => {
    const priceMock = jest.spyOn(Price, 'find').mockImplementation();
    renderHook(() => API.usePrices('guid'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/prices/guid',
      expect.any(Function),
    );
    expect(priceMock).toBeCalledWith({
      order: {
        date: 'ASC',
      },
      where: {
        fk_commodity: {
          guid: 'guid',
        },
      },
    });
  });

  it('calls useSWRImmutable with expected params for useInvestments when guid passed', () => {
    renderHook(() => API.useInvestments('guid'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/investments/guid',
      expect.any(Function),
    );
    expect(queries.getInvestments).toBeCalledWith('guid');
  });
});
