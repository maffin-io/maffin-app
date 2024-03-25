import React from 'react';
import { DataSource } from 'typeorm';
import { DateTime, Interval } from 'luxon';
import { renderHook, waitFor } from '@testing-library/react';
import {
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
import Money from '@/book/Money';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useCashFlow', () => {
  let datasource: DataSource;
  let root: Account;
  let account1: Account;
  let account2: Account;
  let tx: Transaction;
  let eur: Commodity;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Split, Transaction, Account, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({ mnemonic: 'EUR', namespace: 'CURRENCY' }).save();

    root = await Account.create({
      name: 'hi',
      type: 'ROOT',
    }).save();

    account1 = await Account.create({
      guid: 'guid1',
      name: 'Bank1',
      fk_commodity: eur,
      parent: root,
      type: 'ASSET',
    }).save();

    account2 = await Account.create({
      guid: 'guid2',
      name: 'Bank2',
      fk_commodity: eur,
      parent: root,
      type: 'ASSET',
    }).save();

    // transfer 50 eur from bank2 to bank1
    tx = await Transaction.create({
      fk_currency: eur,
      description: 'description',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 50,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -50,
          quantityDenom: 1,
        }),
      ],
    }).save();

    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(async () => {
    await datasource.destroy();
    QUERY_CLIENT.removeQueries();
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
        total: expect.any(Money),
      },
    ]);
    expect(result.current.data?.[0].total.toString()).toEqual('-50.00 EUR');

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid1', 'cashflow', TEST_INTERVAL.toISODate()],
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

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid1', 'cashflow', '2022-01-01/2022-01-02'],
    );
  });

  /**
   * Given the following:
   * - one account in EUR and another in USD
   * - first tx in EUR and second in USD
   * - first tx sends 50 EUR to account1 and second sends 100 EUR in to account1
   *
   * check that when we retrieve the cash flow for
   * account1 it creates a row  with 150 EUR referencing account2
   */
  it('works with different commodities with account in tx currency', async () => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    account2.fk_commodity = usd;
    await account2.save();

    tx.splits[1].quantityNum = -55;
    await tx.save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx2',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -108,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account1.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0].total.toString()).toEqual('-150.00 EUR');

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid1', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });

  /**
   * Given the following:
   *  - one account in EUR, another in USD and another in EUR
   *  - first tx in EUR, second in USD and third in EUR
   *  - first tx withdraws 55 USD from account2
   *  - second tx withdraws 108 USD from account2
   *  - third tx adds 108 USD to account2
   *
   * check that it creates two entries:
   *  - one that withdraws 163 USD referencing account1
   *  - one that sends 108 USD referencing account3
   */
  it('works with different commodities with account not in tx currency', async () => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    account2.fk_commodity = usd;
    await account2.save();

    tx.splits[1].quantityNum = -55;
    await tx.save();

    await Transaction.create({
      fk_currency: usd,
      description: 'tx2',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -108,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Bank3',
      fk_commodity: eur,
      parent: root,
      type: 'ASSET',
    }).save();

    tx = await Transaction.create({
      fk_currency: eur,
      description: 'tx3',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account2,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 108,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account3,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account2.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0].total.toString()).toEqual('163.00 USD');
    expect(result.current.data?.[1].total.toString()).toEqual('-108.00 USD');

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid2', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });

  /**
   * Transactions with more than 2 splits are calculated differently for
   * cash flow computation. We pick the total amount in the split of the account
   * we are checking and then use the other splits to calculate the partial amount.
   *
   * As an example, say we have a tx with the following:
   *  - -100 in account1
   *  - +75 in account2
   *  - +25 in account3
   *
   * This case is simple as we want two rows same as the splits.
   */
  it('works with 3 splits in same currency', async () => {
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Bank3',
      fk_commodity: eur,
      parent: root,
      type: 'ASSET',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 25,
          valueDenom: 1,
          quantityNum: 25,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 75,
          valueDenom: 1,
          quantityNum: 75,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account3,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account3.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0].name).toEqual('Bank1');
    expect(result.current.data?.[0].total.toString()).toEqual('25.00 EUR');
    expect(result.current.data?.[1].name).toEqual('Bank2');
    expect(result.current.data?.[1].total.toString()).toEqual('75.00 EUR');

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid3', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });

  /**
   * The above case is simple however, when
   * the accounts have different currencies, this gets a bit more complicated:
   *
   * - -108 USD/-100 EUR in account1
   * - 75 EUR/75 EUR in account2
   * - 25 EUR/25 EUR in account3
   *
   * Because the tx currency is in EUR, we don't know the partial amounts in USD
   * for the other splits. We want the cashflow in USD as we are generating it for
   * account1 so we have to calculate those amounts as:
   *
   *  108/100 * split.quantity
   */
  it('works with 3 splits transactions with different currency', async () => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Bank3',
      fk_commodity: usd,
      parent: root,
      type: 'ASSET',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: 25,
          valueDenom: 1,
          quantityNum: 25,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 75,
          valueDenom: 1,
          quantityNum: 75,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account3,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -108,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account3.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0].name).toEqual('Bank1');
    expect(result.current.data?.[0].total.toString()).toEqual('27.00 USD');
    expect(result.current.data?.[1].name).toEqual('Bank2');
    expect(result.current.data?.[1].total.toString()).toEqual('81.00 USD');

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid3', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });
});
