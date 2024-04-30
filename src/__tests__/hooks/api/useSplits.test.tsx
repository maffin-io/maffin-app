import React from 'react';
import { DateTime, Interval } from 'luxon';
import { DataSource } from 'typeorm';
import { renderHook, waitFor } from '@testing-library/react';
import {
  QueryClientProvider,
  DefinedUseQueryResult,
} from '@tanstack/react-query';

import {
  useSplits,
  useSplitsCount,
  useSplitsPagination,
} from '@/hooks/api';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import * as stateHooks from '@/hooks/state';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useSplits', () => {
  let datasource: DataSource;
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  describe('useSplits', () => {
    beforeEach(() => {
      jest.spyOn(Split, 'find').mockResolvedValue([{ guid: 'split_guid' } as Split]);
    });

    it('forwards find options', async () => {
      const { result } = renderHook(
        () => useSplits({ type: 'INVESTMENT' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toEqual('success'));
      expect(result.current.data).toEqual([
        { guid: 'split_guid' },
      ]);

      const queryCache = QUERY_CLIENT.getQueryCache().getAll();
      expect(queryCache).toHaveLength(1);
      expect(queryCache[0].queryKey).toEqual(
        ['api', 'splits', { type: 'INVESTMENT' }],
      );
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
        description: 'description1',
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
        date: TEST_INTERVAL.start?.plus({ month: 2 }),
        description: 'description2',
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
      it('returns pageSize instances', async () => {
        const { result } = renderHook(
          () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 1 }),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toMatchObject([
          expect.objectContaining({
            guid: tx2.splits[0].guid,
            balance: 100, // balance contains splits inserted previously so 50 + 50
          }),
        ]);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          [
            'api', 'splits', 'guid', 'page',
            {
              interval: TEST_INTERVAL.toISODate(),
              pageIndex: 0,
              pageSize: 1,
              search: '',
            },
          ],
        );
      });

      it('filters by interval', async () => {
        const interval = Interval.fromDateTimes(
          (TEST_INTERVAL.start as DateTime),
          (TEST_INTERVAL.start as DateTime).plus({ month: 1 }),
        );
        jest.spyOn(stateHooks, 'useInterval').mockReturnValue({
          data: interval,
        } as DefinedUseQueryResult<Interval>);

        const { result } = renderHook(
          () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 1 }),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toMatchObject([
          expect.objectContaining({
            guid: tx1.splits[0].guid,
            balance: 50, // this is the first split so balance is 50
          }),
        ]);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          [
            'api', 'splits', 'guid', 'page',
            {
              interval: interval.toISODate(),
              pageIndex: 0,
              pageSize: 1,
              search: '',
            },
          ],
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
          [
            'api', 'splits', 'guid', 'page',
            {
              interval: TEST_INTERVAL.toISODate(),
              pageIndex: 0,
              pageSize: 1,
              search: '',
            },
          ],
        );
      });

      it('filters with search term', async () => {
        const { result } = renderHook(
          () => useSplitsPagination('guid', { pageIndex: 0, pageSize: 2 }, 'description1'),
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
          [
            'api', 'splits', 'guid', 'page',
            {
              interval: TEST_INTERVAL.toISODate(),
              pageIndex: 0,
              pageSize: 2,
              search: 'description1',
            },
          ],
        );
      });
    });

    describe('useSplitsCount', () => {
      it('filters by interval', async () => {
        const { result } = renderHook(
          () => useSplitsCount('guid'),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toEqual(2);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          [
            'api', 'splits', 'guid', 'count',
            { interval: TEST_INTERVAL.toISODate(), search: '' },
          ],
        );
      });

      it('filters with search term', async () => {
        const { result } = renderHook(
          () => useSplitsCount('guid', 'description2'),
          { wrapper },
        );

        await waitFor(() => expect(result.current.status).toEqual('success'));
        expect(result.current.data).toEqual(1);

        const queryCache = QUERY_CLIENT.getQueryCache().getAll();
        expect(queryCache).toHaveLength(1);
        expect(queryCache[0].queryKey).toEqual(
          [
            'api', 'splits', 'guid', 'count',
            { interval: TEST_INTERVAL.toISODate(), search: 'description2' },
          ],
        );
      });
    });
  });
});
