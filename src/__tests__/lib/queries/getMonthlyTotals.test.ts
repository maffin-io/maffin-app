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
    const monthlyTotals = await getMonthlyTotals([], TEST_INTERVAL);
    expect(monthlyTotals).toEqual([{}, {}, {}, {}, {}, {}]);
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
      Interval.fromDateTimes(
        DateTime.fromISO('2022-12-01'),
        DateTime.fromISO('2023-02-01'),
      ),
    );

    expect(monthlyTotals).toHaveLength(2);
    expect(monthlyTotals[0]).toEqual({});
    expect(monthlyTotals[1].abcdef.toString()).toEqual('-200.00 EUR');
    expect(monthlyTotals[1].ghijk.toString()).toEqual('200.00 EUR');
  });
});
