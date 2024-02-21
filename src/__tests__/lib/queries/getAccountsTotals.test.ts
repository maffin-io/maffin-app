import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getAccountsTotals } from '@/lib/queries';
import { PriceDBMap } from '@/book/prices';
import Money from '@/book/Money';

describe('getAccountsTotals', () => {
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

  it('returns empty when no accounts', async () => {
    const totals = await getAccountsTotals([], {} as PriceDBMap, DateTime.now());

    expect(totals).toEqual({});
  });

  it('returns empty for accounts without splits', async () => {
    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.now(),
    );

    expect(totals[assetAccount.guid].toString()).toEqual(new Money(0, 'EUR').toString());
    expect(totals[expensesAccount.guid].toString()).toEqual(new Money(0, 'EUR').toString());
    expect(totals.type_asset.toString()).toEqual(new Money(0, 'EUR').toString());
    expect(totals.type_expense.toString()).toEqual(new Money(0, 'EUR').toString());
  });

  it('aggregates with same currency', async () => {
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-02-01'),
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
          fk_account: assetAccount,
        }),
      ],
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.now(),
    );

    expect(totals[assetAccount.guid].toString()).toEqual(new Money(-300, 'EUR').toString());
    expect(totals[expensesAccount.guid].toString()).toEqual(new Money(300, 'EUR').toString());
    expect(totals.type_asset.toString()).toEqual(new Money(-300, 'EUR').toString());
    expect(totals.type_expense.toString()).toEqual(new Money(300, 'EUR').toString());
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
          quantityNum: 100,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -100,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-02-01'),
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
          fk_account: assetAccount,
        }),
      ],
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.fromISO('2023-01-10'),
    );

    expect(totals[assetAccount.guid].toString()).toEqual(new Money(-100, 'EUR').toString());
    expect(totals[expensesAccount.guid].toString()).toEqual(new Money(100, 'EUR').toString());
  });

  /**
   * While income and expense accounts can only be in main currency, asset
   * and liability accounts can be in any commodity. When calculating aggregate
   * we want to convert all the quantities to main currency so we have an accurate
   * total.
   */
  it('aggregates with different currency', async () => {
    const usd = await Commodity.create({
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    }).save();

    const bankAccount = await Account.create({
      name: 'Bank',
      fk_commodity: usd,
      parent: assetAccount,
      type: 'BANK',
    }).save();
    // refresh childrenIds
    await bankAccount.reload();
    await assetAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -107.71,
          quantityDenom: 1,
          fk_account: bankAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-02-01'),
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
          quantityNum: -215.42,
          quantityDenom: 1,
          fk_account: bankAccount,
        }),
      ],
    }).save();

    const todayUSDEURPrice = await Price.create({
      valueNum: 9284,
      valueDenom: 10000,
      date: DateTime.now(),
      fk_commodity: usd,
      fk_currency: eur,
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount, bankAccount],
      new PriceDBMap([todayUSDEURPrice]),
      DateTime.now(),
    );

    expect(totals[bankAccount.guid].toString()).toEqual(new Money(-323.13, 'USD').toString());
    expect(totals.type_asset.toString()).toEqual(new Money(-300, 'EUR').toString());
    expect(totals.type_expense.toString()).toEqual(new Money(300, 'EUR').toString());
  });

  /**
   * Same as above but when a selectedDate is passed, the exchange rate is
   * for that day
   */
  it('picks exchange rate from selectedDate', async () => {
    const usd = await Commodity.create({
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    }).save();

    const bankAccount = await Account.create({
      name: 'Bank',
      fk_commodity: usd,
      parent: assetAccount,
      type: 'BANK',
    }).save();
    // refresh childrenIds
    await bankAccount.reload();
    await assetAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -100,
          valueDenom: 1,
          quantityNum: -107.71,
          quantityDenom: 1,
          fk_account: bankAccount,
        }),
      ],
    }).save();
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-02-01'),
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
          quantityNum: -215.42,
          quantityDenom: 1,
          fk_account: bankAccount,
        }),
      ],
    }).save();

    const todayUSDEURPrice = await Price.create({
      valueNum: 9284,
      valueDenom: 10000,
      date: DateTime.now(),
      fk_commodity: usd,
      fk_currency: eur,
    }).save();

    const selectedUSDEURPrice = await Price.create({
      valueNum: 8000,
      valueDenom: 10000,
      date: DateTime.fromISO('2023-02-01'),
      fk_commodity: usd,
      fk_currency: eur,
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount, bankAccount],
      new PriceDBMap([todayUSDEURPrice, selectedUSDEURPrice]),
      DateTime.fromISO('2023-02-01'),
    );

    expect(totals[bankAccount.guid].toString()).toEqual(new Money(-323.13, 'USD').toString());
    // Asset and Expense account having different total amounts may be counter intuitive
    // but this is the right thing:
    //
    // - Asset accounts reflect the net worth for the given date. I.e. if you have 300 USD
    //   but the exchange rate at the selected date is 0.8, then that's your asset value
    // - Expense accounts reflect what you spent at the time you did. Their value is
    //   retrieved from the value field specified in the field and it doesn't depend on
    //   exchange rate of the passed date or today's
    expect(totals.type_asset.toString()).toEqual(new Money(-258.51, 'EUR').toString());
    expect(totals.type_expense.toString()).toEqual(new Money(300, 'EUR').toString());
  });

  /**
   * All investment commodities must have an associated currency. When aggregating
   * investment accounts, we retrieve the price of that stock/ticker. If the currency
   * associated to that stock is different to the parent's account, then we convert
   * it to that currency
   */
  it('aggregates for stock account', async () => {
    const usd = await Commodity.create({
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    }).save();
    const ticker = await Commodity.create({
      mnemonic: 'TICKER',
      namespace: 'CUSTOM',
    }).save();

    const stockAccount = await Account.create({
      name: 'STOCK',
      fk_commodity: ticker,
      parent: assetAccount,
      type: 'INVESTMENT',
    }).save();
    // refresh childrenIds
    await stockAccount.reload();
    await assetAccount.reload();

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: -1000,
          valueDenom: 1,
          quantityNum: -1000,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
        Split.create({
          valueNum: 1000,
          valueDenom: 1,
          quantityNum: 2,
          quantityDenom: 1,
          fk_account: stockAccount,
        }),
      ],
    }).save();

    const todayUSDEURPrice = await Price.create({
      valueNum: 9284,
      valueDenom: 10000,
      date: DateTime.now(),
      fk_commodity: usd,
      fk_currency: eur,
    }).save();

    const todayStockPrice = await Price.create({
      valueNum: 600,
      valueDenom: 1,
      date: DateTime.now(),
      fk_commodity: ticker,
      fk_currency: eur,
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount, stockAccount],
      new PriceDBMap([todayUSDEURPrice, todayStockPrice]),
      DateTime.now(),
    );

    expect(totals[stockAccount.guid].toString()).toEqual(new Money(2, 'TICKER').toString());
    // We get 200 here because we bought 2 stocks at price of 1000 but when converting
    // with today's price we get 1200 (1 is 600) so it's a benefit of 200
    expect(totals.type_asset.toString()).toEqual(new Money(200, 'EUR').toString());
  });
});
