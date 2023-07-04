import crypto from 'crypto';
import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import Stocker from '../../../../apis/Stocker';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '../../../entities';
import { createTransaction } from '../../../lib/transaction';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('createTransaction', () => {
  let eur: Commodity;
  let root: Account;
  let datasource: DataSource;
  let assetAccount: Account;
  let expenseAccount: Account;

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
      guid: 'eur_guid',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      guid: 'root_account_guid',
      name: 'Root account',
      type: 'ROOT',
    }).save();

    assetAccount = await Account.create({
      guid: 'account_guid_1',
      name: 'bank',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    expenseAccount = await Account.create({
      guid: 'account_guid_2',
      name: 'Expense',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    assetAccount.path = 'Assets:bank';
    expenseAccount.path = 'Expenses:Expense1';
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('creates transaction with single split', async () => {
    await createTransaction(
      DateTime.fromISO('2023-01-01'),
      'My expense',
      Split.create({
        guid: 'split1',
        fk_account: assetAccount,
        valueNum: -100,
        valueDenom: 1,
        quantityNum: -100,
        quantityDenom: 1,
      }),
      [
        Split.create({
          guid: 'split2',
          fk_account: expenseAccount,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
        }),
      ],
    );

    const transactions = await Transaction.find({
      relations: {
        splits: {
          fk_account: true,
        },
      },
      order: {
        splits: {
          fk_account: {
            name: 'DESC',
          },
        },
      },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      date: DateTime.fromISO('2023-01-01'),
      description: 'My expense',
      enterDate: expect.any(Date),
      fk_currency: eur,
      guid: expect.any(String),
      splits: [
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: -100,
          valueDenom: 1,
          valueNum: -100,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_1',
            name: 'bank',
            type: 'ASSET',
          },
        },
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: 100,
          valueDenom: 1,
          valueNum: 100,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_2',
            name: 'Expense',
            type: 'EXPENSE',
          },
        },
      ],
    });
    expect(await Price.find()).toHaveLength(0);
  });

  it('creates transaction for investment account', async () => {
    const stockCom = await Commodity.create({
      guid: 'stock_com',
      namespace: 'MC',
      mnemonic: 'IAG.MC',
    }).save();

    const stockAccount = await Account.create({
      guid: 'account_guid_3',
      name: 'IAG.MC',
      type: 'STOCK',
      fk_commodity: stockCom,
      parent: root,
    }).save();

    await createTransaction(
      DateTime.fromISO('2023-01-01'),
      'Buy IAG',
      Split.create({
        guid: 'split1',
        fk_account: stockAccount,
        valueNum: 20,
        valueDenom: 1,
        quantityNum: 20,
        quantityDenom: 1,
      }),
      [
        Split.create({
          guid: 'split2',
          fk_account: assetAccount,
          valueNum: -20,
          valueDenom: 1,
          quantityNum: -378, // value * exchangeRate (1.89)
          quantityDenom: 10,
        }),
      ],
    );

    const transactions = await Transaction.find({
      relations: {
        splits: {
          fk_account: true,
        },
      },
      order: {
        splits: {
          fk_account: {
            name: 'DESC',
          },
        },
      },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      date: DateTime.fromISO('2023-01-01'),
      description: 'Buy IAG',
      enterDate: expect.any(Date),
      fk_currency: eur,
      guid: expect.any(String),
      splits: [
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 10,
          quantityNum: -378,
          valueDenom: 10,
          valueNum: -378,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_1',
            name: 'bank',
            type: 'ASSET',
          },
        },
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: 20,
          valueDenom: 10,
          valueNum: 378,
          fk_account: {
            fk_commodity: stockCom,
            guid: 'account_guid_3',
            name: 'IAG.MC',
            type: 'STOCK',
          },
        },
      ],
    });
    expect(await Price.find()).toHaveLength(0);
  });

  it('creates transaction with multiple splits', async () => {
    await createTransaction(
      DateTime.fromISO('2023-01-01'),
      'My expense',
      Split.create({
        guid: 'split1',
        fk_account: assetAccount,
        valueNum: -150,
        valueDenom: 1,
        quantityNum: -150,
        quantityDenom: 1,
      }),
      [
        Split.create({
          guid: 'split2',
          fk_account: expenseAccount,
          valueNum: 100,
          valueDenom: 1,
          quantityNum: 100,
          quantityDenom: 1,
        }),
        Split.create({
          guid: 'split3',
          fk_account: expenseAccount,
          valueNum: 50,
          valueDenom: 1,
          quantityNum: 50,
          quantityDenom: 1,
        }),
      ],
    );

    const transactions = await Transaction.find({
      relations: {
        splits: {
          fk_account: true,
        },
      },
      order: {
        splits: {
          fk_account: {
            name: 'DESC',
          },
        },
      },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      date: DateTime.fromISO('2023-01-01'),
      description: 'My expense',
      enterDate: expect.any(Date),
      fk_currency: eur,
      guid: expect.any(String),
      splits: [
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: -150,
          valueDenom: 1,
          valueNum: -150,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_1',
            name: 'bank',
            type: 'ASSET',
          },
        },
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: 100,
          valueDenom: 1,
          valueNum: 100,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_2',
            name: 'Expense',
            type: 'EXPENSE',
          },
        },
        {
          action: '',
          guid: expect.any(String),
          quantityDenom: 1,
          quantityNum: 50,
          valueDenom: 1,
          valueNum: 50,
          fk_account: {
            fk_commodity: eur,
            guid: 'account_guid_2',
            name: 'Expense',
            type: 'EXPENSE',
          },
        },
      ],
    });
    expect(await Price.find()).toHaveLength(0);
  });

  it('creates price entry when not mainCurrency and investment', async () => {
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice').mockResolvedValue({
      price: 0.987,
      currency: 'USD',
    });

    const stockCom = await Commodity.create({
      guid: 'stock_com',
      namespace: 'AS',
      mnemonic: 'IDVY.AS',
    }).save();

    const stockAccount = await Account.create({
      guid: 'account_guid_3',
      name: 'IDVY.AS',
      type: 'STOCK',
      fk_commodity: stockCom,
      parent: root,
    }).save();

    const usd = await Commodity.create({
      guid: 'usd_guid',
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();
    assetAccount.fk_commodity = usd;
    await assetAccount.save();

    await createTransaction(
      DateTime.fromISO('2023-01-01'),
      'Buy IDVY.AS',
      Split.create({
        guid: 'split1',
        fk_account: stockAccount,
        valueNum: 20,
        valueDenom: 1,
        quantityNum: 20,
        quantityDenom: 1,
      }),
      [
        Split.create({
          guid: 'split2',
          fk_account: assetAccount,
          valueNum: -20,
          valueDenom: 1,
          quantityNum: -3422, // value * exchangeRate (17.11)
          quantityDenom: 10,
        }),
      ],
    );

    const prices = await Price.find();
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({
      date: DateTime.fromISO('2023-01-01'),
      fk_commodity: usd,
      fk_currency: eur,
      valueNum: 987,
      valueDenom: 1000,
    });

    expect(mockGetPrice).toHaveBeenCalledWith('USDEUR=X', DateTime.fromISO('2023-01-01'));
  });
});
