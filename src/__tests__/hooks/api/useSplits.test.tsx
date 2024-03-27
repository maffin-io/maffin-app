import React from 'react';
import { DateTime, Interval } from 'luxon';
import { DataSource } from 'typeorm';
import { renderHook, waitFor } from '@testing-library/react';
import {
  QueryClientProvider,
  UseQueryResult,
  DefinedUseQueryResult,
} from '@tanstack/react-query';

import {
  useSplits,
  useSplitsCount,
  useSplitsPagination,
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
import * as aggregations from '@/helpers/accountsTotalAggregations';
import * as stateHooks from '@/hooks/state';
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

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
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
    QUERY_CLIENT.removeQueries();
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

      const queryCache = QUERY_CLIENT.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(['api', 'splits', 'guid', { guid: 'guid' }]);
    });
  });

  describe('pagination', () => {
    let tx1: Transaction;
    let tx2: Transaction;

    beforeEach(async () => {
      const eur = await Commodity.create({ mnemonic: 'EUR', namespace: 'CURRENCY' }).save();
      const account2 = await Account.create({
        name: 'account',
        type: 'ASSET',
        parent: account1,
        fk_commodity: eur,
      }).save();

      tx1 = await Transaction.create({
        // inside the interval
        date: TEST_INTERVAL.start?.plus({ month: 1 }),
        description: 'description',
        fk_currency: eur,
        splits: [
          await Split.create({
            fk_account: account1,
            valueNum: 50,
            valueDenom: 1,
            quantityNum: 50,
            quantityDenom: 1,
          }).save(),
          await Split.create({
            fk_account: account2,
            valueNum: -50,
            valueDenom: 1,
            quantityNum: -50,
            quantityDenom: 1,
          }).save(),
        ],
      }).save();

      tx2 = await Transaction.create({
        // outside the interval
        date: TEST_INTERVAL.start?.minus({ month: 1 }),
        description: 'description',
        fk_currency: eur,
        splits: [
          await Split.create({
            fk_account: account1,
            valueNum: 50,
            valueDenom: 1,
            quantityNum: 50,
            quantityDenom: 1,
          }).save(),
          await Split.create({
            fk_account: account2,
            valueNum: -50,
            valueDenom: 1,
            quantityNum: -50,
            quantityDenom: 1,
          }).save(),
        ],
      }).save();

      jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('useSplitsPagination', () => {
      it('calls query as expected', async () => {
        const { result } = renderHook(
          () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 1 }),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toMatchObject([
          expect.objectContaining({
            guid: tx1.splits[0].guid,
            balance: 100, // balance contains splits inserted previously so 50 + 50
          }),
        ]);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          ['api', 'splits', 'guid', 'page', { interval: TEST_INTERVAL.toISODate(), pageIndex: 0, pageSize: 1 }],
        );
      });

      /**
       * If there are no previous splits, the SUM returns null so we have to coalesce it to 0
       */
      it('coalesces to 0 when no splits before interval', async () => {
        await tx2.splits[0].remove();

        const { result } = renderHook(
          () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 1 }),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toMatchObject([
          expect.objectContaining({
            guid: tx1.splits[0].guid,
            balance: 50,
          }),
        ]);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          ['api', 'splits', 'guid', 'page', { interval: TEST_INTERVAL.toISODate(), pageIndex: 0, pageSize: 1 }],
        );
      });
    });

    describe('useSplitsCount', () => {
      it('calls query as expected', async () => {
        const { result } = renderHook(
          () => useSplitsCount('guid'),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toEqual(1);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          ['api', 'splits', 'guid', 'count', { interval: TEST_INTERVAL.toISODate() }],
        );
      });
    });
  });

  describe('useAccountsMonthlyTotal', () => {
    beforeEach(() => {
      jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
      jest.spyOn(usePricesHook, 'usePrices').mockReturnValue({
        data: {},
      } as UseQueryResult<PriceDBMap>);
      jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);

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

      const queryCache = QUERY_CLIENT.getQueryCache().getAll();
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

      const interval = Interval.fromDateTimes(
        DateTime.now().minus({ months: 10 }),
        DateTime.now().minus({ months: 8 }),
      );
      const { result } = renderHook(
        () => useAccountsMonthlyTotal(interval),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      const queryCache = QUERY_CLIENT.getQueryCache().getAll();
      expect(queryCache[0].queryKey).toEqual(
        [
          'api',
          'splits',
          {
            aggregation: 'monthly-total',
            interval: interval.toISODate(),
            accountsUpdatedAt: 1,
          }],
      );

      expect(useAccountsHook.useAccounts).toBeCalledWith();
      expect(usePricesHook.usePrices).toBeCalledWith({});
      expect(queries.getMonthlyTotals).toBeCalledWith([], interval);
      expect(result.current.data?.[0].type_asset.toString()).toEqual('400.00 EUR');

      expect(aggregations.aggregateChildrenTotals).toBeCalledTimes(2);
      expect(aggregations.aggregateChildrenTotals).nthCalledWith(
        1,
        ['type_income', 'type_expense', 'type_asset', 'type_liability'],
        [],
        {},
        interval.start?.endOf('month').startOf('day'),
        {
          type_asset: expect.any(Money),
        },
      );
      expect(aggregations.aggregateChildrenTotals).nthCalledWith(
        2,
        ['type_income', 'type_expense', 'type_asset', 'type_liability'],
        [],
        {},
        interval.start?.plus({ month: 1 }).endOf('month').startOf('day'),
        {
          type_asset: expect.any(Money),
        },
      );
    });
  });
});
