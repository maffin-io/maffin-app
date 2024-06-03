import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  BankConfig,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getAccountsTotals } from '@/lib/queries';

describe('getAccountsTotals', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let assetAccount: Account;
  let expensesAccount: Account;
  let incomeAccount: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, BankConfig, Commodity, Price, Split, Transaction],
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
      guid: 'guid1',
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();
    await assetAccount.reload();

    expensesAccount = await Account.create({
      guid: 'guid2',
      name: 'Expenses',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();
    await expensesAccount.reload();

    incomeAccount = await Account.create({
      guid: 'guid3',
      name: 'Income',
      type: 'INCOME',
      fk_commodity: eur,
      parent: root,
    }).save();
    await incomeAccount.reload();

    await root.reload();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('returns empty when no accounts', async () => {
    const totals = await getAccountsTotals([], TEST_INTERVAL);
    expect(totals).toEqual({});
  });

  it('returns empty when accounts with no splits', async () => {
    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      TEST_INTERVAL,
    );
    expect(totals).toEqual({});
  });

  it('sums splits and calls as expected', async () => {
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-08-01'),
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
      date: DateTime.fromISO('2022-09-01'),
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

    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-08-01'),
      fk_currency: eur,
      splits: [
        Split.create({
          valueNum: -75,
          valueDenom: 1,
          quantityNum: -75,
          quantityDenom: 1,
          fk_account: incomeAccount,
        }),
        Split.create({
          valueNum: 75,
          valueDenom: 1,
          quantityNum: 75,
          quantityDenom: 1,
          fk_account: assetAccount,
        }),
      ],
    }).save();

    const totals = await getAccountsTotals(
      [root, assetAccount, expensesAccount, incomeAccount],
      TEST_INTERVAL,
    );

    expect(totals.guid1.toString()).toEqual('-225 EUR');
    expect(totals.guid2.toString()).toEqual('300 EUR');
    expect(totals.guid3.toString()).toEqual('75 EUR');
  });

  it('filters by date', async () => {
    await Transaction.create({
      description: 'description',
      date: DateTime.fromISO('2022-09-01'),
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
      date: TEST_INTERVAL.start?.minus({ month: 1 }),
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
      TEST_INTERVAL,
    );

    expect(totals.guid1.toString()).toEqual('-100 EUR');
    expect(totals.guid2.toString()).toEqual('100 EUR');
  });
});
