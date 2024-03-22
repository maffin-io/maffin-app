import React from 'react';
import { DateTime, Interval } from 'luxon';
import { DataSource } from 'typeorm';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';

import {
  useSplits,
  useSplitsCount,
  useSplitsPagination,
  useAccountsMonthlyTotal,
  useAccountsMonthlyWorth,
  useCashFlow,
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
import * as aggregations from '@/helpers/accountsTotalAggregations';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/lib/queries');
jest.mock('@/hooks/api/useAccounts', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useAccounts'),
}));
jest.mock('@/hooks/api/usePrices', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/usePrices'),
}));
jest.mock('@/helpers/accountsTotalAggregations', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/accountsTotalAggregations'),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSplits', () => {
  let datasource: DataSource;
  let split1: Split;
  let account1: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Split, Transaction, Account, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    account1 = await Account.create({
      guid: 'guid',
      name: 'hi',
      type: 'ROOT',
    }).save();

    split1 = await Split.create({
      fk_account: account1,
      valueNum: 50,
      valueDenom: 1,
      quantityNum: 100,
      quantityDenom: 1,
    }).save();

    await Split.create({
      fk_account: account1,
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
        () => useSplitsPagination('guid', TEST_INTERVAL, { pageIndex: 0, pageSize: 1 }),
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

  describe('useAccountsMonthlyTotal', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
        data: {},
      } as UseQueryResult<PriceDBMap>);
      jest.spyOn(queries, 'getMonthlyTotals').mockResolvedValue([
        {
          type_asset: new Money(100, 'EUR'),
        },
        {
          type_asset: new Money(200, 'EUR'),
        },
      ] as AccountsTotals[]);
      jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
        type_asset: new Money(400, 'EUR'),
      } as AccountsTotals);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('is pending when no accounts', async () => {
      const { result } = renderHook(
        () => useAccountsMonthlyTotal(TEST_INTERVAL),
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
            interval: TEST_INTERVAL.toISODate(),
          },
        ],
      );
    });

    it('calls query as expected', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);

      const { result } = renderHook(
        () => useAccountsMonthlyTotal(TEST_INTERVAL),
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
            interval: TEST_INTERVAL.toISODate(),
            accountsUpdatedAt: 1,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith([], TEST_INTERVAL);
      expect(result.current.data?.[0].type_asset.toString()).toEqual('400.00 EUR');

      // Although we pass an interval, given we only have two datapoints,
      // it calculates only for the first two
      expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        ['type_income', 'type_expense'],
        [],
        {},
        TEST_INTERVAL.start?.endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        ['type_income', 'type_expense'],
        [],
        {},
        TEST_INTERVAL.start?.plus({ month: 1 }).endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
    });
  });

  describe('useAccountsMonthlyWorth', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
        data: {},
      } as UseQueryResult<PriceDBMap>);
      jest.spyOn(queries, 'getMonthlyTotals').mockResolvedValue([
        {
          type_asset: new Money(200, 'EUR'),
        },
      ] as AccountsTotals[]);
      jest.spyOn(aggregations, 'aggregateMonthlyWorth').mockReturnValue([
        {
          type_asset: new Money(500, 'EUR'),
        },
        {
          type_asset: new Money(700, 'EUR'),
        },
      ] as AccountsTotals[]);
      jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
        type_asset: new Money(1000, 'EUR'),
      } as AccountsTotals);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('is pending when no accounts', async () => {
      const { result } = renderHook(
        () => useAccountsMonthlyWorth(TEST_INTERVAL),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('pending'));

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(2);
      // this hook depends on the useBalanceSheet hook
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'balance-sheet',
            date: TEST_INTERVAL.start?.endOf('month').toISODate(),
          },
        ],
      );
      expect(queryCache[1].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-worth',
            interval: TEST_INTERVAL.toISODate(),
            totalsUpdatedAt: 0,
          },
        ],
      );
    });

    it('calls query as expected', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);
      jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
        type_asset: new Money(500, 'EUR'),
      } as AccountsTotals);

      const { result } = renderHook(
        () => useAccountsMonthlyWorth(TEST_INTERVAL),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data?.[0].type_asset.toString()).toEqual('1000.00 EUR');
      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache[1].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-worth',
            interval: TEST_INTERVAL.toISODate(),
            accountsUpdatedAt: 1,
            totalsUpdatedAt: 0,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith([], TEST_INTERVAL);

      expect(aggregations.aggregateMonthlyWorth).toBeCalledTimes(1);
      expect(aggregations.aggregateMonthlyWorth).toBeCalledWith(
        ['type_asset', 'type_liability'],
        [],
        [
          {
            type_asset: expect.any(Money),
          },
          {
            type_asset: expect.any(Money),
          },
        ],
        [
          // For calculating the balance for a month, we use the last day of the month
          TEST_INTERVAL.start?.endOf('month'),
          expect.any(DateTime),
          expect.any(DateTime),
          expect.any(DateTime),
          expect.any(DateTime),
          expect.any(DateTime),
          TEST_INTERVAL.end,
        ],
      );
      expect(
        (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][0].type_asset.toString(),
      ).toEqual('500.00 EUR');
      expect(
        (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][1].type_asset.toString(),
      ).toEqual('200.00 EUR');

      // Although we pass an interval, given we only have two datapoints,
      // it calculates only for the first two
      expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        ['type_asset', 'type_liability'],
        [],
        {},
        TEST_INTERVAL.start?.endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        ['type_asset', 'type_liability'],
        [],
        {},
        TEST_INTERVAL.start?.plus({ month: 1 }).endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
    });
  });

  describe('useCashFlow', () => {
    it('calls query as expected', async () => {
      const commodity = await Commodity.create({
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      }).save();

      const account2 = await Account.create({
        name: 'Bank',
        fk_commodity: commodity,
        parent: account1,
        type: 'ASSET',
      }).save();

      await Transaction.create({
        fk_currency: commodity,
        description: 'description',
        date: DateTime.now(),
        splits: [
          split1,
          Split.create({
            fk_account: account2,
            valueNum: -50,
            valueDenom: 1,
            quantityNum: -100,
            quantityDenom: 1,
          }),
        ],
      }).save();

      const { result } = renderHook(
        () => useCashFlow(account1.guid),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toEqual([
        {
          guid: account2.guid,
          name: account2.name,
          type: account2.type,
          total: -100,
        },
        {
          guid: account1.guid,
          name: account1.name,
          type: account1.type,
          total: 100,
        },
      ]);

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', 'guid', 'cashflow', '2023-01-01/2023-01-01'],
      );
    });
  });
});
