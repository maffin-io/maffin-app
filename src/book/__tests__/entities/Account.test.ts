import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
  BaseEntity,
} from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '../../entities';

describe('Account', () => {
  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity, Account, Split, Transaction, Price],
      synchronize: true,
      logging: false,
    });
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  describe('TypeORM entity', () => {
    beforeEach(async () => {
      await Commodity.create({
        guid: 'commodity_guid',
        namespace: 'CURRENCY',
        mnemonic: 'mnemonic',
      }).save();

      const root = await Account.create({
        guid: 'root_account_guid',
        name: 'Root account',
        type: 'ROOT',
        fk_commodity: 'commodity_guid',
      }).save();

      await Account.create({
        guid: 'account_guid',
        name: 'name',
        type: 'ASSET',
        fk_commodity: 'commodity_guid',
        parent: root,
      }).save();
    });

    it('is active record', async () => {
      const instance = await Account.findOneByOrFail({ guid: 'account_guid' });
      expect(instance).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve account', async () => {
      const accounts = await Account.find();

      expect(accounts[0].guid).toEqual('root_account_guid');
      expect(accounts[1].guid).toEqual('account_guid');
    });

    it('tree relations are accessible', async () => {
      const [rootAccount, account] = await Account.find({
        relations: ['parent', 'children'],
      });

      expect(rootAccount.children[0].guid).toEqual(account.guid);
      expect(account.parent.guid).toEqual(rootAccount.guid);
    });

    it('loads commodity eagerly', async () => {
      const instance = await Account.findOneByOrFail({ guid: 'account_guid' });
      expect(instance.commodity.guid).toEqual('commodity_guid');
    });

    it('loads splits and calculates total', async () => {
      await Transaction.create({
        guid: 'tx_guid',
        fk_currency: 'commodity_guid',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      await Split.create({
        guid: 'guid',
        valueNum: 10,
        valueDenom: 100,
        quantityNum: 15,
        quantityDenom: 100,
        fk_transaction: 'tx_guid',
        fk_account: 'account_guid',
      }).save();

      const instance = await Account.findOneOrFail({
        where: { guid: 'account_guid' },
        relations: ['splits'],
      });

      expect(instance.splits).toEqual([
        {
          guid: 'guid',
          action: '',
          valueNum: 10,
          valueDenom: 100,
          quantityNum: 15,
          quantityDenom: 100,
        },
      ]);
      expect(instance.total.toString()).toEqual('0.15 mnemonic');
    });

    it('total is calculated as absolute', async () => {
      await Transaction.create({
        guid: 'tx_guid',
        fk_currency: 'commodity_guid',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      await Split.create({
        guid: 'guid',
        valueNum: -10,
        valueDenom: 100,
        quantityNum: -15,
        quantityDenom: 100,
        fk_transaction: 'tx_guid',
        fk_account: 'account_guid',
      }).save();

      const instance = await Account.findOneOrFail({
        where: { guid: 'account_guid' },
        relations: ['splits'],
      });

      expect(instance.total.toString()).toEqual('0.15 mnemonic');
    });
  });

  describe('total', () => {
    beforeEach(async () => {
      await Commodity.create({
        guid: 'eur_guid',
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();
    });

    it('sets expected total for ROOT', async () => {
      await Account.create({
        guid: 'account_guid',
        name: 'account',
        type: 'ROOT',
      }).save();

      const account = await Account.findOneByOrFail({ name: 'account' });

      expect(account.total).toEqual(null);
    });

    it.each([
      'ASSET', 'BANK', 'CASH', 'EQUITY', 'LIABILITY', 'INCOME', 'EXPENSE',
    ])('sets expected total for %s', async (type) => {
      await Account.create({
        guid: 'account_guid',
        name: 'account',
        type,
        fk_commodity: 'eur_guid',
      }).save();

      await Transaction.create({
        guid: 'tx_guid',
        fk_currency: 'eur_guid',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      await Split.create({
        guid: 'guid',
        valueNum: 10,
        valueDenom: 100,
        quantityNum: 15,
        quantityDenom: 100,
        fk_transaction: 'tx_guid',
        fk_account: 'account_guid',
      }).save();

      const account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: { splits: true },
      });

      expect(account.total.toString()).toEqual('0.15 EUR');
    });

    it.each([
      'MUTUAL', 'STOCK',
    ])('sets expected total for %s', async (type) => {
      await Commodity.create({
        guid: 'googl_guid',
        namespace: 'NASDAQ',
        mnemonic: 'GOOGL',
      }).save();

      await Account.create({
        guid: 'account_guid',
        name: 'account',
        type,
        fk_commodity: 'googl_guid',
      }).save();

      await Transaction.create({
        guid: 'tx_guid',
        fk_currency: 'eur_guid',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      await Split.create({
        guid: 'guid',
        action: 'Buy',
        valueNum: 10,
        valueDenom: 100,
        quantityNum: 200,
        quantityDenom: 100,
        fk_transaction: 'tx_guid',
        fk_account: 'account_guid',
      }).save();

      const account = await Account.findOneOrFail({
        where: { name: 'account' },
        relations: ['splits', 'splits.fk_transaction'],
      });

      expect(account.total.toString()).toEqual('2.00 GOOGL');
    });
  });
});
