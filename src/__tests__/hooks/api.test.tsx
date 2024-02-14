import { renderHook } from '@testing-library/react';
import * as swrImmutable from 'swr/immutable';
import * as swr from 'swr';
import * as query from '@tanstack/react-query';
import { BareFetcher, SWRResponse } from 'swr';

import { Commodity } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';
import * as API from '@/hooks/api';
import * as queries from '@/lib/queries';
import { InvestmentAccount } from '@/book/models';
import { AccountsMap } from '@/types/book';

jest.mock('swr');

jest.mock('@tanstack/react-query');

jest.mock('@/lib/queries');

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
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
    ['useInvestments', '/api/investments', queries.getInvestments],
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
    ['useInvestment', '/api/investments/guid', queries.getInvestment],
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

  it.each([
    'useInvestment',
    'useInvestments',
  ])('propagates error for %s', (name) => {
    jest.spyOn(swrImmutable, 'default').mockReturnValue({ error: 'error' } as SWRResponse);
    // @ts-ignore
    renderHook(() => expect(() => API[name]()).toThrow('error'));
  });

  describe('useStartDate', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.useStartDate());

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['/api/txs', { name: 'start' }],
        queryFn: expect.any(Function),
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getEarliestDate).toBeCalled();
    });
  });

  describe('useMainCurrency', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.useMainCurrency());

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['/api/commodities', { guid: 'main' }],
        queryFn: expect.any(Function),
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getMainCurrency).toBeCalled();
    });
  });

  describe('usePrices', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.usePrices({ guid: 'guid' } as Commodity));

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['/api/prices', { commodity: 'guid' }],
        queryFn: expect.any(Function),
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getPrices).toBeCalledWith({ from: { guid: 'guid' } });
    });
  });

  describe('useLatestTxs', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.useLatestTxs());

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['/api/txs', { name: 'latest' }],
        queryFn: expect.any(Function),
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getLatestTxs).toBeCalled();
    });
  });

  describe('useAccountsMonthlyTotals', () => {
    it('calls useSWRImmutable with expected params for useAccountsMonthlyTotals', () => {
      const accounts = { a: { guid: 'a' } } as AccountsMap;
      const todayPrices = new PriceDBMap();
      jest.spyOn(query, 'useQuery')
        .mockReturnValueOnce({ data: accounts } as query.UseQueryResult<AccountsMap>);
      jest.spyOn(swrImmutable, 'default')
        .mockReturnValueOnce({ data: todayPrices } as SWRResponse);
      renderHook(() => API.useAccountsMonthlyTotals());

      expect(swrImmutable.default).toHaveBeenNthCalledWith(
        2,
        '/api/monthly-totals',
        expect.any(Function),
      );
      expect(queries.getMonthlyTotals).toBeCalledWith(accounts, todayPrices);
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
