import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';
import * as swr from 'swr';
import { BareFetcher, SWRResponse } from 'swr';

import { Account, Commodity } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';
import * as API from '@/hooks/api';
import * as queries from '@/lib/queries';
import * as gapiHooks from '@/hooks/useGapiClient';
import * as getUserModule from '@/lib/getUser';
import { InvestmentAccount } from '@/book/models';

jest.mock('swr');

jest.mock('@/lib/queries');

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
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
    jest.spyOn(Commodity, 'findOneByOrFail').mockImplementation();
    jest.spyOn(Commodity, 'find').mockImplementation();
    jest.spyOn(getUserModule, 'default').mockImplementation();
    jest.spyOn(swrImmutable, 'default').mockImplementation(
      jest.fn((key, f: BareFetcher | null) => {
        f?.(key);
        return {
          data: [],
          error: undefined,
        } as SWRResponse;
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['useCommodities', '/api/commodities', jest.spyOn(Commodity, 'find')],
    ['useAccounts', '/api/accounts', queries.getAccounts],
    ['useInvestments', '/api/investments', queries.getInvestments],
    ['useStartDate', '/api/start-date', queries.getEarliestDate],
    ['useMainCurrency', '/api/main-currency', queries.getMainCurrency],
    ['useLatestTxs', '/api/txs/latest', queries.getLatestTxs],
  ])('calls useSWRImmutable with expected params for %s', (name, key, f) => {
    // @ts-ignore
    renderHook(() => API[name]());

    expect(swrImmutable.default).toBeCalledWith(
      key,
      expect.any(Function),
    );

    expect(f).toBeCalledTimes(1);
    expect(f).toBeCalledWith();
  });

  it.each([
    ['useAccount', '/api/accounts/guid', queries.getAccounts],
    ['useInvestment', '/api/investments/guid', queries.getInvestment],
    ['useSplits', '/api/splits/guid', queries.getSplits],
  ])('calls useSWRImmutable with expected params for %s', (name, key, f) => {
    // @ts-ignore
    renderHook(() => API[name]('guid'));

    expect(swrImmutable.default).toBeCalledWith(
      key,
      expect.any(Function),
    );

    expect(f).toBeCalledTimes(1);
    expect(f).toBeCalledWith('guid');
  });

  it('calls useSWRImmutable with expected params for usePrices', () => {
    // @ts-ignore
    renderHook(() => API.usePrices({ guid: 'guid' }));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/prices/guid',
      expect.any(Function),
    );

    expect(queries.getPrices).toBeCalledTimes(1);
    expect(queries.getPrices).toBeCalledWith({ from: { guid: 'guid' } });
  });

  it('calls useSWRImmutable with expected params for useCommodity', () => {
    const f = jest.spyOn(Commodity, 'findOneByOrFail');
    // @ts-ignore
    renderHook(() => API.useCommodity('guid'));

    expect(swrImmutable.default).toBeCalledWith(
      '/api/commodities/guid',
      expect.any(Function),
    );

    expect(f).toBeCalledTimes(1);
    expect(f).toBeCalledWith({ guid: 'guid' });
  });

  it.each([
    'useAccount',
    'useAccounts',
    'useInvestment',
    'useInvestments',
    'useCommodity',
    'useCommodities',
  ])('propagates error for %s', (name) => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({ error: 'error' } as SWRResponse);
    // @ts-ignore
    renderHook(() => expect(() => API[name]()).toThrow('error'));
  });

  describe('useAccountsMonthlyTotals', () => {
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
  });

  describe('useUser', () => {
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

  describe('useCommodities', () => {
    it('mutates detail keys', () => {
      jest.spyOn(swrImmutable, 'default').mockReturnValue({
        data: [
          { guid: '1' } as Commodity,
          { guid: '2' } as Commodity,
        ],
      } as SWRResponse);
      renderHook(() => API.useCommodities());

      expect(swr.mutate).toBeCalledWith('/api/commodities/1', { guid: '1' }, { revalidate: false });
      expect(swr.mutate).toBeCalledWith('/api/commodities/2', { guid: '2' }, { revalidate: false });
    });
  });

  describe('useAccounts', () => {
    it('mutates detail keys', () => {
      jest.spyOn(swrImmutable, 'default').mockReturnValue({
        data: {
          1: { guid: '1' } as Account,
          2: { guid: '2' } as Account,
        },
      } as SWRResponse);
      renderHook(() => API.useAccounts());

      expect(swrImmutable.default).toBeCalledWith(
        '/api/accounts',
        expect.any(Function),
      );
      expect(swr.mutate).toBeCalledWith('/api/accounts/1', { guid: '1' }, { revalidate: false });
      expect(swr.mutate).toBeCalledWith('/api/accounts/2', { guid: '2' }, { revalidate: false });
    });
  });

  describe('useInvestments', () => {
    it('mutates detail keys', () => {
      jest.spyOn(swrImmutable, 'default').mockReturnValue({
        data: [
          { account: { guid: '1' } } as InvestmentAccount,
          { account: { guid: '2' } } as InvestmentAccount,
        ],
      } as SWRResponse);
      renderHook(() => API.useInvestments());

      expect(swrImmutable.default).toBeCalledWith(
        '/api/investments',
        expect.any(Function),
      );
      expect(swr.mutate).toBeCalledWith(
        '/api/investments/1',
        { account: { guid: '1' } },
        { revalidate: false },
      );
      expect(swr.mutate).toBeCalledWith(
        '/api/investments/2',
        { account: { guid: '2' } },
        { revalidate: false },
      );
    });
  });
});
