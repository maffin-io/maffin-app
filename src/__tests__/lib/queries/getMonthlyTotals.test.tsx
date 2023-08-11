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

describe('getMonthlyTotals', () => {
  let datasource: DataSource;
  let eur: Commodity;
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

    const root = await Account.create({
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

    expensesAccount = await Account.create({
      guid: 'expenses',
      name: 'Expenses',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('returns empty when no transactions', async () => {
    const monthlyTotals = await getMonthlyTotals();

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
    const monthlyTotals = await getMonthlyTotals();

    expect(monthlyTotals).toEqual({
      assets: {
        '01/2023': -200,
        '02/2022': -400,
      },
      expenses: {
        '01/2023': 200,
        '02/2022': 400,
      },
    });
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

    const monthlyTotals = await getMonthlyTotals();

    expect(monthlyTotals).toEqual({});
  });
});
