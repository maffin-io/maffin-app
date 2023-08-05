import { DateTime } from 'luxon';
import { DataSource, BaseEntity } from 'typeorm';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '../../entities';

describe('Account', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let account: Account;
  let account2: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    account = await Account.create({
      name: 'name',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    account2 = await Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      parent: root,
      fk_commodity: eur,
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('entity', () => {
    it('is active record', async () => {
      const instance = await Account.findOneByOrFail({ name: 'name' });
      expect(instance).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve account', async () => {
      const accounts = await Account.find();

      expect(accounts[0].name).toEqual('Root');
      expect(accounts[1].name).toEqual('name');
    });

    it('tree relations are accessible', async () => {
      const rootAccount = await Account.findOneOrFail({
        where: { type: 'ROOT' },
        relations: ['parent', 'children'],
      });

      account = await Account.findOneOrFail({
        where: { name: 'name' },
        relations: ['parent', 'children'],
      });

      account2 = await Account.findOneOrFail({
        where: { name: 'Expenses' },
        relations: ['parent', 'children'],
      });

      expect(rootAccount.children[0].guid).toEqual(account.guid);
      expect(rootAccount.children[1].guid).toEqual(account2.guid);
      expect(account.parent.guid).toEqual(rootAccount.guid);
      expect(account2.parent.guid).toEqual(rootAccount.guid);
    });

    it('loads commodity eagerly', async () => {
      const instance = await Account.findOneByOrFail({ name: 'name' });
      expect(instance.commodity.mnemonic).toEqual('EUR');
    });

    it('loads splits', async () => {
      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -15,
            quantityDenom: 100,
            fk_account: account,
          }),
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 15,
            quantityDenom: 100,
            fk_account: account2,
          }),
        ],
      }).save();

      const instance = await Account.findOneOrFail({
        where: { name: 'name' },
        relations: ['splits'],
      });

      expect(instance.splits).toEqual([
        {
          guid: expect.any(String),
          action: '',
          valueNum: -10,
          valueDenom: 100,
          quantityNum: -15,
          quantityDenom: 100,
        },
      ]);
    });
  });

  describe('getTotal and getMonthlyTotals', () => {
    it('sets expected getTotal for ROOT', async () => {
      account = await Account.findOneByOrFail({ name: 'Root' });

      expect(account.getTotal()).toEqual(null);
    });

    it.each([
      'INCOME', 'LIABILITY',
    ])('sets expected total for %s', async (type) => {
      account = await Account.create({
        name: 'account',
        type,
        fk_commodity: eur,
        parent: root,
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 15,
            quantityDenom: 100,
            fk_account: account2,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -15,
            quantityDenom: 100,
            fk_account: account,
          }),
        ],
      }).save();

      account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: { splits: { fk_transaction: true } },
      });

      expect(account.getTotal().toString()).toEqual('0.15 EUR');
      expect(account.getMonthlyTotals()['Jan/23'].toString()).toEqual('0.15 EUR');
    });

    it('sets expected total for ASSET', async () => {
      account = await Account.create({
        name: 'account',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 15,
            quantityDenom: 100,
            fk_account: account2,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -15,
            quantityDenom: 100,
            fk_account: account,
          }),
        ],
      }).save();

      account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: { splits: { fk_transaction: true } },
      });

      expect(account.getTotal().toString()).toEqual('-0.15 EUR');
      expect(account.getMonthlyTotals()['Jan/23'].toString()).toEqual('-0.15 EUR');
    });

    it('sets expected total for EXPENSE', async () => {
      account = await Account.create({
        name: 'account',
        type: 'EXPENSE',
        fk_commodity: eur,
        parent: root,
      }).save();

      account2 = await Account.create({
        name: 'name',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 15,
            quantityDenom: 100,
            fk_account: account,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -15,
            quantityDenom: 100,
            fk_account: account2,
          }),
        ],
      }).save();

      account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: { splits: { fk_transaction: true } },
      });

      expect(account.getTotal().toString()).toEqual('0.15 EUR');
      expect(account.getMonthlyTotals()['Jan/23'].toString()).toEqual('0.15 EUR');
    });

    it.each([
      'MUTUAL', 'STOCK',
    ])('sets expected total for %s', async (type) => {
      const googl = await Commodity.create({
        namespace: 'NASDAQ',
        mnemonic: 'GOOGL',
      }).save();

      const assetAccount = await Account.create({
        name: 'account',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      }).save();

      account = await Account.create({
        name: 'stockAccount',
        type,
        fk_commodity: googl,
        parent: assetAccount,
      }).save();

      account2 = await Account.create({
        name: 'broker',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            action: 'Buy',
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 200,
            quantityDenom: 100,
            fk_account: account,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -200,
            quantityDenom: 100,
            fk_account: account2,
          }),
        ],
      }).save();

      account = await Account.findOneOrFail({
        where: { name: 'stockAccount' },
        relations: { splits: { fk_transaction: true } },
      });

      expect(account.getTotal().toString()).toEqual('2.00 GOOGL');
      expect(account.getMonthlyTotals()['Jan/23'].toString()).toEqual('2.00 GOOGL');
    });

    it('filters according to interval', async () => {
      account = await Account.create({
        name: 'account',
        type: 'EXPENSE',
        fk_commodity: eur,
        parent: root,
      }).save();

      account2 = await Account.create({
        name: 'name',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 15,
            quantityDenom: 100,
            fk_account: account,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -15,
            quantityDenom: 100,
            fk_account: account2,
          }),
        ],
      }).save();

      await Transaction.create({
        description: 'test',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-03'),
        splits: [
          Split.create({
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 20,
            quantityDenom: 100,
            fk_account: account,
          }),
          Split.create({
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -20,
            quantityDenom: 100,
            fk_account: account2,
          }),
        ],
      }).save();

      account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: { splits: { fk_transaction: true } },
      });

      expect(account.getTotal(
        DateTime.fromISO('2023-01-02'),
      ).toString()).toEqual('0.15 EUR');
    });
  });

  describe('validation', () => {
    it('fails if name not long enough', async () => {
      account = Account.create({
        name: 'a',
        type: 'ASSET',
        fk_commodity: eur,
        parent: root,
      });

      await expect(account.save()).rejects.toThrow('isLength');
    });

    it('fails if type not in allowed types', async () => {
      account = Account.create({
        name: 'name',
        type: 'INVALID',
        fk_commodity: eur,
        parent: root,
      });

      await expect(account.save()).rejects.toThrow('isIn');
    });

    it('fails if parent empty when not root', async () => {
      account = Account.create({
        name: 'name',
        type: 'EXPENSE',
        fk_commodity: eur,
      });

      await expect(account.save()).rejects.toThrow('isNotEmpty');
    });

    it('fails if commodity empty when not root', async () => {
      account = Account.create({
        name: 'name',
        type: 'EXPENSE',
        parent: root,
      });

      await expect(account.save()).rejects.toThrow('isNotEmpty');
    });

    it('fails if type not compatible with parent', async () => {
      account = Account.create({
        name: 'name',
        type: 'BANK',
        parent: root,
        fk_commodity: eur,
      });

      await expect(account.save()).rejects.toThrow('checkAccountType');
    });

    it('fails if currency assigned to investment account', async () => {
      account = Account.create({
        name: 'name',
        type: 'STOCK',
        parent: root,
        fk_commodity: eur,
      });

      await expect(account.save()).rejects.toThrow('checkCommodity');
    });
  });
});
