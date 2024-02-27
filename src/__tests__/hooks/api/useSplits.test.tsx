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
  useAccountsTotals,
  useAccountsMonthlyTotal,
  useAccountsMonthlyWorth,
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
    beforeEach(async () => {
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
        date: DateTime.now().minus({ day: 1 }),
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
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls query as expected', async () => {
      const { result } = renderHook(
        () => useAccountTotal('guid'),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toEqual(100);

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', 'guid', 'total', '2023-01-01'],
      );
    });
  });

  describe('useAccountsTotals', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({ data: {} } as UseQueryResult<PriceDBMap>);
      jest.spyOn(queries, 'getAccountsTotals').mockResolvedValue({
        type_asset: new Money(0, 'EUR'),
      } as AccountsTotals);
      jest.spyOn(aggregations, 'aggregateChildrenTotals').mockReturnValue({
        type_asset: new Money(0, 'EUR'),
      } as AccountsTotals);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('is pending when no accounts/prices', async () => {
      const { result } = renderHook(
        () => useAccountsTotals(DateTime.fromISO('2023-01-01')),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('pending'));

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', { aggregation: 'total', date: '2023-01-01' }],
      );
      expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
    });

    it('calls query as expected', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);

      const { result } = renderHook(
        () => useAccountsTotals(DateTime.fromISO('2023-01-01')),
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
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getAccountsTotals).toBeCalledWith([], DateTime.fromISO('2023-01-01'));
      expect(result.current.data?.type_asset.toString()).toEqual('0.00 EUR');
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        'type_root',
        [],
        {},
        DateTime.now(),
        { type_asset: expect.any(Money) },
      );
    });

    it('uses alternative select', async () => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
        data: [] as Account[],
        dataUpdatedAt: 1,
      } as UseQueryResult<Account[]>);

      const mockSelect = jest.fn();
      const { result } = renderHook(
        () => useAccountsTotals(DateTime.fromISO('2023-01-01'), mockSelect),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));

      expect(aggregations.aggregateChildrenTotals).not.toBeCalled();
      expect(mockSelect).toBeCalledWith({ type_asset: expect.any(Money) });
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

      const interval = Interval.fromDateTimes(
        DateTime.now().minus({ months: 10 }),
        DateTime.now().minus({ months: 8 }),
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
            dates: '2022-03-01/2022-05-01',
            accountsUpdatedAt: 1,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith([], interval);
      expect(result.current.data?.[0].type_asset.toString()).toEqual('400.00 EUR');

      expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        'type_root',
        [],
        {},
        interval.start?.endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        'type_root',
        [],
        {},
        interval.end,
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
        () => useAccountsMonthlyWorth(),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('pending'));

      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache).toHaveLength(2);
      // this hook depends on the useAccountsTotals hook
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'total',
            date: '2022-07-31',
          },
        ],
      );
      expect(queryCache[1].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-worth',
            dates: '2022-07-01/2023-01-01',
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

      const interval = Interval.fromDateTimes(
        DateTime.now().minus({ months: 10 }),
        DateTime.now().minus({ months: 8 }),
      );
      const { result } = renderHook(
        () => useAccountsMonthlyWorth(interval),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      const queryCache = queryClient.getQueryCache().getAll();
      expect(queryCache[1].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-worth',
            dates: '2022-03-01/2022-05-01',
            accountsUpdatedAt: 1,
            totalsUpdatedAt: 0,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith(
        [],
        Interval.fromDateTimes(
          // +1 month because initial month is computed with useAccountsTotals
          (interval.start as DateTime).plus({ month: 1 }),
          interval.end as DateTime,
        ),
      );
      expect(result.current.data?.[0].type_asset.toString()).toEqual('1000.00 EUR');

      expect(aggregations.aggregateMonthlyWorth).toBeCalledTimes(1);
      expect(aggregations.aggregateMonthlyWorth).toBeCalledWith(
        'type_root',
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
          interval.start?.endOf('month'),
          interval.end,
        ],
      );
      expect(
        (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][0].type_asset.toString(),
      ).toEqual('500.00 EUR');
      expect(
        (aggregations.aggregateMonthlyWorth as jest.Mock).mock.calls[0][2][1].type_asset.toString(),
      ).toEqual('200.00 EUR');

      expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        'type_root',
        [],
        {},
        interval.start?.endOf('month'),
        {
          type_asset: expect.any(Money),
        },
      );
      expect(aggregations.aggregateChildrenTotals).toBeCalledWith(
        'type_root',
        [],
        {},
        interval.end,
        {
          type_asset: expect.any(Money),
        },
      );
    });
  });
});
