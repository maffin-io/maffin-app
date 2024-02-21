import React from 'react';
import { DateTime, Interval } from 'luxon';
import { DataSource } from 'typeorm';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';

import {
  useSplits,
  useSplitsCount,
  useSplitsPagination,
  useAccountTotal,
  useAccountsTotal,
  useAccountsMonthlyTotal,
} from '@/hooks/api';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as usePricesHook from '@/hooks/api/usePrices';
import * as queries from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import Money from '@/book/Money';
import * as aggregateChildrenTotals from '@/helpers/aggregateChildrenTotals';
import type { AccountsMonthlyTotals, AccountsTotals } from '@/types/book';

jest.mock('@/lib/queries');
jest.mock('@/hooks/api/useAccounts', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useAccounts'),
}));
jest.mock('@/hooks/api/usePrices', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/usePrices'),
}));
jest.mock('@/helpers/aggregateChildrenTotals', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/aggregateChildrenTotals'),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSplits', () => {
  let datasource: DataSource;
  let split1: Split;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Split, Transaction, Account, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const account = await Account.create({
      guid: 'guid',
      name: 'hi',
      type: 'ROOT',
    }).save();

    split1 = await Split.create({
      fk_account: account.guid,
      valueNum: 50,
      valueDenom: 1,
      quantityNum: 100,
      quantityDenom: 1,
    }).save();

    await Split.create({
      fk_account: account.guid,
      valueNum: 100,
      valueDenom: 1,
      quantityNum: 200,
      quantityDenom: 1,
    }).save();
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  describe('useSplits', () => {
    beforeEach(() => {
      jest.spyOn(Split, 'find').mockResolvedValue([split1]);
    });

    it('calls query as expected', async () => {
      const { result } = renderHook(() => useSplits({ guid: 'guid' }), { wrapper });

      await waitFor(() => expect(result.current.data).toEqual([split1]));
      expect(Split.find).toBeCalledWith({
        where: {
          fk_account: {
            guid: 'guid',
          },
        },
        relations: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
        order: {
          fk_transaction: {
            date: 'DESC',
            enterDate: 'DESC',
          },
          quantityNum: 'ASC',
        },
      });

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(['api', 'splits', 'guid', { guid: 'guid' }]);
    });
  });

  describe('useSplitsPagination', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls query as expected', async () => {
      const { result } = renderHook(
        () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 1 }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toMatchObject([
        expect.objectContaining({
          guid: split1.guid,
          balance: 300,
        }),
      ]);

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', 'guid', 'page', { pageIndex: 0, pageSize: 1 }],
      );
    });
  });

  describe('useSplitsCount', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls query as expected', async () => {
      const { result } = renderHook(
        () => useSplitsCount('guid'),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toEqual(2);

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', 'guid', 'count'],
      );
    });
  });

  describe('useAccountTotal', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls query as expected', async () => {
      const { result } = renderHook(
        () => useAccountTotal('guid'),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toEqual(300);

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', 'guid', 'total'],
      );
    });
  });

  describe('useAccountsTotal', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
      jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
        type_asset: new Money(0, 'EUR'),
      } as AccountsTotals);
      jest.spyOn(aggregateChildrenTotals, 'default').mockReturnValue({
        type_asset: new Money(0, 'EUR'),
      } as AccountsTotals);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('is pending when no accounts/prices', async () => {
      const { result } = renderHook(
        () => useAccountsTotal(DateTime.fromISO('2023-01-01')),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('pending'));

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', { aggregation: 'total', date: '2023-01-01' }],
      );
      expect(aggregateChildrenTotals.default).not.toBeCalled();
    });

    it('calls query as expected', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
        data: {},
        dataUpdatedAt: 2,
      } as UseQueryResult<PriceDBMap>);

      const { result } = renderHook(
        () => useAccountsTotal(DateTime.fromISO('2023-01-01')),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'total',
            date: '2023-01-01',
            accountsUpdatedAt: 1,
            pricesUpdatedAt: 2,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getAccountsTotals).toBeCalledWith([], DateTime.fromISO('2023-01-01'));
      expect(result.current.data?.type_asset.toString()).toEqual('0.00 EUR');
      expect(aggregateChildrenTotals.default).toBeCalledWith(
        'type_root',
        [],
        {},
        DateTime.now(),
        { type_asset: expect.any(Money) },
      );
    });
  });

  describe('useAccountsMonthlyTotal', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
      jest.spyOn(queries, 'getMonthlyTotals').mockResolvedValue({
        type_asset: {
          '01/2023': new Money(0, 'EUR'),
        },
      } as AccountsMonthlyTotals);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('is pending when no accounts/prices', async () => {
      const { result } = renderHook(
        () => useAccountsMonthlyTotal(),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('pending'));

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-total',
            dates: '2022-07-01/2023-01-01',
          },
        ],
      );
    });

    it('calls query as expected', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
        data: {},
        dataUpdatedAt: 2,
      } as UseQueryResult<PriceDBMap>);

      const interval = Interval.fromDateTimes(
        DateTime.now().minus({ months: 10 }),
        DateTime.now(),
      );
      const { result } = renderHook(
        () => useAccountsMonthlyTotal(interval),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-total',
            dates: '2022-03-01/2023-01-01',
            accountsUpdatedAt: 1,
            pricesUpdatedAt: 2,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith([], {}, interval);
      expect(result.current.data?.type_asset['01/2023'].toString()).toEqual('0.00 EUR');
    });
  });
});
