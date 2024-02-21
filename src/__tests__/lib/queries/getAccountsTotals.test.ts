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
import * as aggregateChildrenTotals from '@/helpers/aggregateChildrenTotals';

jest.mock('@/helpers/aggregateChildrenTotals', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/aggregateChildrenTotals'),
}));

describe('getAccountsTotals', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let assetAccount: Account;
  let expensesAccount: Account;

  beforeEach(async () => {
    jest.spyOn(aggregateChildrenTotals, 'default').mockReturnValue({ totals: new Money(0, 'EUR') });
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

  it('calls with expected params whe no accounts', async () => {
    await getAccountsTotals([], {} as PriceDBMap, DateTime.now());

    expect(aggregateChildrenTotals.default).toBeCalledWith('type_root', [], {}, DateTime.now(), {});
  });

  it('calls with expected params when accounts without splits', async () => {
    await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.now(),
    );

    expect(aggregateChildrenTotals.default).toBeCalledWith(
      'type_root',
      [
        root,
        assetAccount,
        expensesAccount,
      ],
      {},
      DateTime.now(),
      {},
    );
  });

  it('sums splits and calls as expected', async () => {
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

    await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.now(),
    );

    expect(aggregateChildrenTotals.default).toBeCalledWith(
      'type_root',
      [root, assetAccount, expensesAccount],
      {},
      DateTime.now(),
      {
        abcdef: expect.any(Money),
        ghijk: expect.any(Money),
      },
    );
    expect(
      (aggregateChildrenTotals.default as jest.Mock).mock.calls[0][4].abcdef.toString(),
    ).toEqual('300.00 EUR');
    expect(
      (aggregateChildrenTotals.default as jest.Mock).mock.calls[0][4].ghijk.toString(),
    ).toEqual('300.00 EUR');
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

    await getAccountsTotals(
      [root, assetAccount, expensesAccount],
      {} as PriceDBMap,
      DateTime.fromISO('2023-01-10'),
    );

    expect(
      (aggregateChildrenTotals.default as jest.Mock).mock.calls[0][4].abcdef.toString(),
    ).toEqual('100.00 EUR');
    expect(
      (aggregateChildrenTotals.default as jest.Mock).mock.calls[0][4].ghijk.toString(),
    ).toEqual('100.00 EUR');
  });
});
