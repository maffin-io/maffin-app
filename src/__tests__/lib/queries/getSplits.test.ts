import { DateTime } from 'luxon';

import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getSplits } from '@/lib/queries';

describe('getSplits', () => {
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
    const splits = await getSplits({ guid: assetAccount.guid });
    expect(splits).toEqual([]);
  });

  it('orders splits by date and quantity', async () => {
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
      date: DateTime.fromISO('2022-01-01'),
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
      date: DateTime.fromISO('2022-01-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: 500,
          valueDenom: 1,
          quantityNum: 1000,
          quantityDenom: 1,
          fk_account: expensesAccount,
        }),
        Split.create({
          valueNum: -500,
          valueDenom: 1,
          quantityNum: -1000,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();

    const splits = await getSplits(
      { guid: assetAccount.guid },
      {
        fk_transaction: {
          splits: {
            fk_account: true,
          },
        },
        fk_account: true,
      },
    );

    expect(splits[0].transaction.date.year).toEqual(2023);
    expect(splits[1].transaction.date.year).toEqual(2022);
    expect(splits[1].quantity).toEqual(-1000);
    expect(splits[2].transaction.date.year).toEqual(2022);
    expect(splits[2].quantity).toEqual(-200);
  });
});
