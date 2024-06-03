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
  BankConfig,
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

describe('useCashFlow', () => {
  let datasource: DataSource;
  let root: Account;
  let account1: Account;
  let account2: Account;
  let eur: Commodity;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Split, Transaction, Account, BankConfig, Commodity],
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
      name: 'Expense',
      fk_commodity: eur,
      parent: root,
      type: 'EXPENSE',
    }).save();

    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(async () => {
    await datasource.destroy();
    QUERY_CLIENT.removeQueries();
  });

  it('calls query as expected', async () => {
    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -50,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 50,
          quantityDenom: 1,
        }),
      ],
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx2',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
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
        total: expect.objectContaining({
          readable: '150 EUR',
        }),
      },
    ]);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      ['api', 'splits', 'guid1', 'cashflow', TEST_INTERVAL.toISODate()],
    );
  });

  it('uses custom interval', async () => {
    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -50,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 50,
          quantityDenom: 1,
        }),
      ],
    }).save();

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
   * - tx sends 50 EUR to account2
   *
   * check that when we retrieve the cash flow for
   * account1 it creates a row with 50 EUR referencing account2
   *
   * check that we retrieve the cash flow for
   * account2 it creates a row with -55 USD referencing account1
   */
  it.each([
    ['guid1', 'Expense', '50 EUR'],
    ['guid2', 'Bank1', '-55 USD'],
  ])('works with different commodities for %s account', async (guid, expectedName, expectedAmount) => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    account2.fk_commodity = usd;
    await account2.save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -50,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 55,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0]).toMatchObject({
      name: expectedName,
      total: expect.objectContaining({
        readable: expectedAmount,
      }),
    });
  });

  /**
   * Given the following:
   *  - one account in EUR, another in USD
   *  - first tx in EUR, second in USD
   *  - first tx withdraws 55 USD from account2
   *  - second tx withdraws 108 USD from account2
   *
   * check that it creates:
   *  - one that withdraws 163 USD referencing account1
   */
  it('works with different txs in different currencies', async () => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    account2.fk_commodity = usd;
    await account2.save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -50,
          valueDenom: 1,
          quantityNum: -50,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 55,
          quantityDenom: 1,
        }),
      ],
    }).save();

    await Transaction.create({
      fk_currency: usd,
      description: 'tx2',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -108,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 108,
          valueDenom: 1,
          quantityNum: 108,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account2.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0]).toMatchObject({
      name: account1.name,
      total: expect.objectContaining({
        readable: '-163 USD',
      }),
    });
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
  it('works with 3 outflow splits in same currency', async () => {
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Expense2',
      fk_commodity: eur,
      parent: root,
      type: 'EXPENSE',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
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
          valueNum: 25,
          valueDenom: 1,
          quantityNum: 25,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account1.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0]).toMatchObject({
      name: account2.name,
      total: expect.objectContaining({
        readable: '75 EUR',
      }),
    });

    expect(result.current.data?.[1]).toMatchObject({
      name: account3.name,
      total: expect.objectContaining({
        readable: '25 EUR',
      }),
    });
  });

  /**
   * Same as the test before but with receiving money into the ASSET
   * account instead of withdrawing
   *
   * As an example, say we have a tx with the following:
   *  - 100 in account1
   *  - -75 in account2
   *  - -25 in account3
   *
   * This case is simple as we want two rows same as the splits.
   */
  it('works with 3 inflow splits in same currency', async () => {
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Income1',
      fk_commodity: eur,
      parent: root,
      type: 'INCOME',
    }).save();

    const account4 = await Account.create({
      guid: 'guid4',
      name: 'Income2',
      fk_commodity: eur,
      parent: root,
      type: 'INCOME',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
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
          fk_account: account3,
          valueNum: -75,
          valueDenom: 1,
          quantityNum: -75,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account4,
          valueNum: -25,
          valueDenom: 1,
          quantityNum: -25,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account1.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0]).toMatchObject({
      name: account3.name,
      total: expect.objectContaining({
        readable: '-75 EUR',
      }),
    });

    expect(result.current.data?.[1]).toMatchObject({
      name: account4.name,
      total: expect.objectContaining({
        readable: '-25 EUR',
      }),
    });
  });

  /**
   * The above case are simple however, when
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
  it('works with 3 splits in different currency', async () => {
    const usd = await Commodity.create({ mnemonic: 'USD', namespace: 'CURRENCY' }).save();
    account1.fk_commodity = usd;
    await account1.save();

    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Expense2',
      fk_commodity: eur,
      parent: root,
      type: 'EXPENSE',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -108,
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
          valueNum: 25,
          valueDenom: 1,
          quantityNum: 25,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account1.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data?.[0]).toMatchObject({
      name: account2.name,
      total: expect.objectContaining({
        readable: '81 USD',
      }),
    });

    expect(result.current.data?.[1]).toMatchObject({
      name: account3.name,
      total: expect.objectContaining({
        readable: '27 USD',
      }),
    });
  });

  /**
   * When you do mortgage payments you have a transaction
   * to two different accounts one being a liability and another
   * being an expense. Liability accounts also display cash flow
   * so we want to make sure that only the split related to the
   * liability payment is shown. For example
   *
   * - -1000 EUR from bank account
   * - + 700 to liability
   * - + 300 to expense
   *
   * We should only see a +300 inflow to the liability account and not
   * +1000 and -300
   */
  it('works with 3 splits mortgage + interest', async () => {
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Loan',
      fk_commodity: eur,
      parent: root,
      type: 'LIABILITY',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
      date: DateTime.now(),
      splits: [
        Split.create({
          fk_account: account1,
          valueNum: -1000,
          valueDenom: 1,
          quantityNum: -1000,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account2,
          valueNum: 300,
          valueDenom: 1,
          quantityNum: 300,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account3,
          valueNum: 700,
          valueDenom: 1,
          quantityNum: 700,
          quantityDenom: 1,
        }),
      ],
    }).save();

    const { result } = renderHook(
      () => useCashFlow(account3.guid),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      name: account1.name,
      total: expect.objectContaining({
        readable: '-700 EUR',
      }),
    });
  });

  /**
   * For tracking dividends, we add a split with 0 value/quantity
   * referencing to the stock. However, we don't want this shown in the cash
   * flow as it is 0 so we ignore it.
   */
  it('ignores 0s', async () => {
    const account3 = await Account.create({
      guid: 'guid3',
      name: 'Investment',
      fk_commodity: eur,
      parent: account1,
      type: 'INVESTMENT',
    }).save();

    const account4 = await Account.create({
      guid: 'guid4',
      name: 'Dividends',
      fk_commodity: eur,
      parent: root,
      type: 'INCOME',
    }).save();

    await Transaction.create({
      fk_currency: eur,
      description: 'tx1',
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
          fk_account: account3,
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 0,
          quantityDenom: 1,
        }),
        Split.create({
          fk_account: account4,
          valueNum: -100,
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

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      name: account4.name,
      total: expect.objectContaining({
        readable: '-100 EUR',
      }),
    });
  });
});
