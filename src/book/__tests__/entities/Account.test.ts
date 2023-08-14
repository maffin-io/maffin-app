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

    it('sets path on save', async () => {
      const account3 = await Account.create({
        name: 'Groceries',
        type: 'EXPENSE',
        parent: account2,
        fk_commodity: eur,
      }).save();

      expect(root.path).toEqual('Root');
      expect(account.path).toEqual('name');
      expect(account2.path).toEqual('Expenses');
      expect(account3.path).toEqual('Expenses:Groceries');
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
