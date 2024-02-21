import { DateTime, Interval } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getMonthlyTotals } from '@/lib/queries';
import { PriceDBMap } from '@/book/prices';

describe('getMonthlyTotals', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let assetAccount: Account;
  let expensesAccount: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      guid: 'a',
      type: 'ROOT',
      name: 'Root',
    }).save();

    assetAccount = await Account.create({
      guid: 'abcdef',
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();
    await assetAccount.reload();

    expensesAccount = await Account.create({
      guid: 'ghijk',
      name: 'Expenses',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();
    await expensesAccount.reload();

    await root.reload();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('returns empty when no transactions', async () => {
    const monthlyTotals = await getMonthlyTotals([], {} as PriceDBMap);

    expect(monthlyTotals).toEqual({});
  });

  it('aggregates as expected', async () => {
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 200,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -200,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-02-05'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 200,
          valueDenom: 1,
          quantityNum: 400,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -200,
          valueDenom: 1,
          quantityNum: -400,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    const monthlyTotals = await getMonthlyTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
    );

    // For asset and liabilities, we accumulate the total
    expect(monthlyTotals.asset['01/2023'].toString()).toEqual('-600.00 EUR');
    expect(monthlyTotals.asset['02/2022'].toString()).toEqual('-400.00 EUR');
    expect(monthlyTotals.abcdef['01/2023'].toString()).toEqual('-600.00 EUR');
    expect(monthlyTotals.abcdef['02/2022'].toString()).toEqual('-400.00 EUR');

    // For expense/income we store the monthly splits
    expect(monthlyTotals.expense['01/2023'].toString()).toEqual('200.00 EUR');
    expect(monthlyTotals.expense['02/2022'].toString()).toEqual('400.00 EUR');
    expect(monthlyTotals.ghijk['01/2023'].toString()).toEqual('200.00 EUR');
    expect(monthlyTotals.ghijk['02/2022'].toString()).toEqual('400.00 EUR');
  });

  it('filters by date', async () => {
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 200,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -200,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-02-05'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 200,
          valueDenom: 1,
          quantityNum: 400,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -200,
          valueDenom: 1,
          quantityNum: -400,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    const monthlyTotals = await getMonthlyTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      Interval.fromDateTimes(
        DateTime.fromISO('2023-01-01'),
        DateTime.now(),
      ),
    );

    // For asset and liabilities, we accumulate the total
    expect(monthlyTotals.asset['01/2023'].toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals.asset['02/2022']).toBe(undefined);
    expect(monthlyTotals.abcdef['01/2023'].toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals.abcdef['02/2022']).toBe(undefined);

    // For expense/income we store the monthly splits
    expect(monthlyTotals.expense['01/2023'].toString()).toEqual('200.00 EUR');
    expect(monthlyTotals.expense['02/2022']).toBe(undefined);
    expect(monthlyTotals.ghijk['01/2023'].toString()).toEqual('200.00 EUR');
    expect(monthlyTotals.ghijk['02/2022']).toBe(undefined);
  });

  it('aggregates children totals into parent', async () => {
    const childAccount = await Account.create({
      guid: 'bank',
      name: 'Bank',
      type: 'BANK',
      fk_commodity: eur,
      parent: assetAccount,
    }).save();
    await assetAccount.reload();
    await childAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 200,
          valueDenom: 1,
          quantityNum: 200,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -200,
          valueDenom: 1,
          quantityNum: -200,
          quantityDenom: 1,
          fk_account: childAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 400,
          valueDenom: 1,
          quantityNum: 400,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -400,
          valueDenom: 1,
          quantityNum: -400,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();

    const monthlyTotals = await getMonthlyTotals(
      [root, assetAccount, expensesAccount, childAccount],
      {} as PriceDBMap,
    );

    expect(monthlyTotals.asset['01/2023'].toString()).toEqual('-600.00 EUR');
    expect(monthlyTotals.bank['01/2023'].toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals.expense['01/2023'].toString()).toEqual('600.00 EUR');
  });

  /**
   * This test checks that we aggregate total networth (asset) by converting prices
   * using the correct exchange rates.
   *
   * For this, we create two transactions to a bank account in USD from an expense in EUR
   * with different dates. Then we check that the total asset value of the parent account
   * of the bank which is in euro is the bank * exchange_rate found IN THAT MONTH
   */
  it('converts children totals when asset account is different currency', async () => {
    const usd = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    const childAccount = await Account.create({
      guid: 'bank',
      name: 'Bank',
      type: 'BANK',
      fk_commodity: usd,
      parent: assetAccount,
    }).save();
    await assetAccount.reload();
    await childAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-11-30'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 80,
          valueDenom: 1,
          quantityNum: 80,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -80,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
          fk_account: childAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-12-30'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 90,
          valueDenom: 1,
          quantityNum: 90,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -90,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
          fk_account: childAccount,
        }),
      ],
    }).save();

    const monthlyTotals = await getMonthlyTotals(
      [root, assetAccount, expensesAccount, childAccount],
      new PriceDBMap([
        Price.create({
          date: DateTime.fromISO('2022-11-30'),
          fk_commodity: usd,
          fk_currency: eur,
          valueNum: 80,
          valueDenom: 100,
        }),
        Price.create({
          date: DateTime.fromISO('2022-12-30'),
          fk_commodity: usd,
          fk_currency: eur,
          valueNum: 90,
          valueDenom: 100,
        }),
      ]),
    );

    expect(monthlyTotals.bank['11/2022'].toString()).toEqual('-100.00 USD');
    // 100USD * 0.8 (which is the exchange rate on Nov)
    expect(monthlyTotals.asset['11/2022'].toString()).toEqual('-80.00 EUR');
    expect(monthlyTotals.expense['11/2022'].toString()).toEqual('80.00 EUR');

    expect(monthlyTotals.bank['12/2022'].toString()).toEqual('-200.00 USD');
    // 200USD * 0.9 (which is the exchange rate on Dec)
    expect(monthlyTotals.asset['12/2022'].toString()).toEqual('-180.00 EUR');
    expect(monthlyTotals.expense['12/2022'].toString()).toEqual('90.00 EUR');
  });

  /**
   * The purpose of this test is to verify that we convert totals for the parent
   * account of INVESTMENT accounts as expected. We buy 2 GOOGL stocks for 50 USD each
   * from the assets account (USD). Our investments account is in EUR so we want to check that:
   *   - We have 2 GOOGL stocks in our stocks account
   *   - We have +98 EUR in the investments account
   *   - We have -100 USD in the broker account
   *   - We have 0 EUR in the assets account
   */
  it('converts children totals when investment', async () => {
    const usd = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    const brokerAccount = await Account.create({
      guid: 'broker',
      name: 'Broker',
      type: 'BANK',
      fk_commodity: usd,
      parent: assetAccount,
    }).save();

    const investmentsAccount = await Account.create({
      guid: 'investments',
      name: 'Investments',
      type: 'ASSET',
      fk_commodity: eur,
      parent: assetAccount,
    }).save();

    const stock = await Commodity.create({
      namespace: 'NASDAQ',
      mnemonic: 'GOOGL',
    }).save();
    const stockAccount = await Account.create({
      guid: 'googl',
      name: 'GOOGL',
      type: 'INVESTMENT',
      fk_commodity: stock,
      parent: investmentsAccount,
    }).save();
    await root.reload();
    await assetAccount.reload();
    await brokerAccount.reload();
    await stockAccount.reload();
    await investmentsAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
          fk_account: brokerAccount,
        }),
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 2,
          quantityDenom: 1,
          fk_account: stockAccount,
        }),
      ],
    }).save();

    const monthlyTotals = await getMonthlyTotals(
      [
        root,
        assetAccount,
        brokerAccount,
        expensesAccount,
        investmentsAccount,
        stockAccount,
      ],
      new PriceDBMap([
        Price.create({
          fk_commodity: stock,
          fk_currency: usd,
          date: DateTime.now(),
          source: '',
          valueNum: 50,
          valueDenom: 1,
        }),
        Price.create({
          fk_commodity: usd,
          fk_currency: eur,
          date: DateTime.now(),
          source: '',
          valueNum: 98,
          valueDenom: 100,
        }),
      ]),
    );

    expect(monthlyTotals.googl['01/2023'].toString()).toEqual('2.00 GOOGL');
    expect(monthlyTotals.investments['01/2023'].toString()).toEqual('98.00 EUR');
    expect(monthlyTotals.broker['01/2023'].toString()).toEqual('-100.00 USD');
    expect(monthlyTotals.asset['01/2023'].toString()).toEqual('0.00 EUR');
  });
});
