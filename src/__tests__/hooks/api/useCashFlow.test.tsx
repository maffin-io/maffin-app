import React from 'react';
import { DataSource } from 'typeorm';
import { DateTime, Interval } from 'luxon';
import { renderHook, waitFor } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  DefinedUseQueryResult,
} from '@tanstack/react-query';

import { useCashFlow } from '@/hooks/api';
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

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCashFlow', () => {
  let datasource: DataSource;
  let account1: Account;
  let account2: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Split, Transaction, Account, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const eur = await Commodity.create({ mnemonic: 'EUR', namespace: 'CURRENCY' }).save();

    account1 = await Account.create({
      guid: 'guid',
      name: 'hi',
      type: 'ROOT',
    }).save();

    account2 = await Account.create({
      name: 'Bank',
      fk_commodity: eur,
      parent: account1,
      type: 'ASSET',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'description',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
        }),
      ],
    }).save();

    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    queryClient.removeQueries();
  });

  it('calls query as expected', async () => {
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
      ['api', 'splits', 'guid', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });

  it('uses custom interval', async () => {
    const { result } = renderHook(
      () => useCashFlow(
        account1.guid,
        Interval.fromDateTimes(
          DateTime.fromISO('2022-01-01'),
          DateTime.fromISO('2022-01-02'),
        ),
      ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual([]);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid', 'cashflow', '2022-01-01/2022-01-02'],
    );
  });
});
