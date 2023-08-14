import { DateTime } from 'luxon';
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
      guid: 'assets',
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();
    await assetAccount.reload();

    expensesAccount = await Account.create({
      guid: 'expenses',
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
    const monthlyTotals = await getMonthlyTotals({}, {} as PriceDBMap);

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
      {
        [assetAccount.guid]: assetAccount,
        [expensesAccount.guid]: expensesAccount,
      },
      {} as PriceDBMap,
    );

    expect(monthlyTotals.assets['01/2023'].toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals.assets['02/2022'].toString()).toEqual('-400.00 EUR');

    expect(monthlyTotals.expenses['01/2023'].toString()).toEqual('200.00 EUR');
    expect(monthlyTotals.expenses['02/2022'].toString()).toEqual('400.00 EUR');
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
      {
        root,
        [assetAccount.guid]: assetAccount,
        [expensesAccount.guid]: expensesAccount,
        [childAccount.guid]: childAccount,
      },
      {} as PriceDBMap,
    );

    expect(monthlyTotals.assets['01/2023'].toString()).toEqual('-600.00 EUR');
    expect(monthlyTotals.bank['01/2023'].toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals.expenses['01/2023'].toString()).toEqual('600.00 EUR');
  });

  it('converts children totals when different currency', async () => {
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
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 98,
          valueDenom: 1,
          quantityNum: 98,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -98,
          valueDenom: 1,
          quantityNum: -100,
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
      {
        root,
        [assetAccount.guid]: assetAccount,
        [expensesAccount.guid]: expensesAccount,
        [childAccount.guid]: childAccount,
      },
      {
        getPrice: (from, to, date) => ({
          guid: `${from}.${to}.${date}`,
          value: 0.98,
        }),
      } as PriceDBMap,
    );

    // 400 EUR + 100USD * 0.98
    expect(monthlyTotals.assets['01/2023'].toString()).toEqual('-498.00 EUR');
    expect(monthlyTotals.bank['01/2023'].toString()).toEqual('-100.00 USD');
    expect(monthlyTotals.expenses['01/2023'].toString()).toEqual('498.00 EUR');
  });

  /**
   * The purpose of this test is to verify that we convert totals for the parent
   * account of STOCK/MUTUAL accounts as expected. We buy 2 GOOGL stocks for 50 USD each
   * from the assets account (USD). Our investments account is in EUR so we want to check that:
   *   - We have 2 GOOGL stocks in our stocks account
   *   - We have -100 USD in the assets account
   *   - We have +98 EUR in the investments account
   */
  it('converts children totals when investment', async () => {
    const stock = await Commodity.create({
      namespace: 'NASDAQ',
      mnemonic: 'GOOGL',
    }).save();
    const usd = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    const investmentsAccount = await Account.create({
      guid: 'investments',
      name: 'Investments',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    const stockAccount = await Account.create({
      guid: 'googl',
      name: 'GOOGL',
      type: 'STOCK',
      fk_commodity: stock,
      parent: investmentsAccount,
    }).save();
    await root.reload();
    assetAccount.fk_commodity = usd;
    await assetAccount.save();
    await assetAccount.reload();
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
          fk_account: assetAccount,
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
      {
        root,
        [assetAccount.guid]: assetAccount,
        [expensesAccount.guid]: expensesAccount,
        [investmentsAccount.guid]: investmentsAccount,
        [stockAccount.guid]: stockAccount,
      },
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
    expect(monthlyTotals.assets['01/2023'].toString()).toEqual('-100.00 USD');
  });

  it('ignores account months with 0', async () => {
    const commodity = await Commodity.create({
      namespace: 'NASDAQ',
      mnemonic: 'GOOGL',
    }).save();

    const split1 = new Split();
    split1.value = 0;
    split1.quantity = 0;
    split1.fk_account = await Account.create({
      name: 'GOOGL',
      type: 'STOCK',
      fk_commodity: commodity,
      parent: assetAccount,
    }).save();

    await Transaction.create({
      description: 'description',
      fk_currency: eur,
      date: DateTime.fromISO('2023-01-01'),
      splits: [split1],
    }).save();

    const monthlyTotals = await getMonthlyTotals(
      {
        [assetAccount.guid]: assetAccount,
      },
      {} as PriceDBMap,
    );

    expect(monthlyTotals).toEqual({});
  });
});
