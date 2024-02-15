import React from 'react';
import { DataSource } from 'typeorm';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useSplits,
  useSplitsCount,
  useSplitsPagination,
  useSplitsTotal,
} from '@/hooks/api';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';

jest.mock('@/lib/queries');

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

  describe('useSplitsTotal', () => {
    it('calls query as expected', async () => {
      const { result } = renderHook(
        () => useSplitsTotal('guid'),
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
});
