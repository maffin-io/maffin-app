import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  BaseEntity,
  Commodity,
  Transaction,
  Split,
  Account,
  BankConfig,
} from '../../entities';

describe('Split', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let account: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, BankConfig, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      namespace: 'namespace',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    account = await Account.create({
      name: 'name',
      type: 'ASSET',
      parent: root,
      fk_commodity: eur,
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('instance', () => {
    beforeEach(async () => {
      await Split.create({
        valueNum: 10,
        valueDenom: 100,
        action: 'whatever',
        quantityNum: 15,
        quantityDenom: 100,
        fk_account: account,
      }).save();
    });

    it('is active record', async () => {
      const splits = await Split.find();
      expect(splits[0]).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve split with relations', async () => {
      const account2 = await Account.create({
        name: 'Expenses',
        type: 'EXPENSE',
        parent: root,
        fk_commodity: eur,
      }).save();

      await Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          Split.create({
            guid: 'split_guid',
            action: 'whatever',
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

      const split = await Split.findOneOrFail({
        where: { guid: 'split_guid' },
        relations: ['fk_account', 'fk_transaction'],
      });

      expect(split).toMatchObject({
        guid: expect.any(String),
        valueNum: -10,
        valueDenom: 100,
        action: 'whatever',
        quantityNum: -15,
        quantityDenom: 100,
      });
      expect(split.account.name).toEqual('name');
      expect(split.transaction.description).toEqual('description');
    });

    it('calculates value', async () => {
      const splits = await Split.find();
      expect(splits[0].value).toEqual(0.1);
    });

    it('calculates quantity', async () => {
      const splits = await Split.find();
      expect(splits[0].quantity).toEqual(0.15);
    });

    it('can set value', async () => {
      const splits = await Split.find();
      const split = splits[0];
      split.value = 1000;
      expect(split.valueNum).toEqual(1000);
      expect(split.valueDenom).toEqual(1);
    });

    it('can set quantity', async () => {
      const splits = await Split.find();
      const split = splits[0];
      split.value = 1000;
      expect(split.valueNum).toEqual(1000);
      expect(split.valueDenom).toEqual(1);
    });
  });

  describe('validation', () => {
    let tx: Transaction;

    beforeEach(async () => {
      tx = Transaction.create({
        fk_currency: eur,
        description: 'description',
        date: DateTime.fromISO('2023-01-01'),
      });
    });

    it('fails when empty account', async () => {
      const split = Split.create({
        valueNum: 10,
        valueDenom: 100,
        quantityNum: 15,
        quantityDenom: 100,
        fk_transaction: tx,
      });

      await expect(split.save()).rejects.toThrow('isNotEmpty');
    });

    it('fails when no valueNum', async () => {
      const split = Split.create({
        valueDenom: 100,
        quantityNum: 15,
        quantityDenom: 100,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('isNumber');
    });

    it('fails when no valueDenom', async () => {
      const split = Split.create({
        valueNum: 15,
        quantityNum: 15,
        quantityDenom: 100,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('isNumber');
    });

    it('fails when no quantityNum', async () => {
      const split = Split.create({
        valueNum: 15,
        valueDenom: 100,
        quantityDenom: 100,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('isNumber');
    });

    it('fails when no quantityDenom', async () => {
      const split = Split.create({
        valueNum: 15,
        valueDenom: 100,
        quantityNum: 15,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('isNumber');
    });

    it('fails when positive INCOME split', async () => {
      account.type = 'INCOME';
      const split = Split.create({
        valueNum: 15,
        valueDenom: 100,
        quantityNum: 15,
        quantityDenom: 100,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('valueSymbol');
    });

    it('fails when negative EXPENSE split', async () => {
      account.type = 'EXPENSE';
      const split = Split.create({
        valueNum: -15,
        valueDenom: 100,
        quantityNum: -15,
        quantityDenom: 100,
        fk_account: account,
      });

      await expect(split.save()).rejects.toThrow('valueSymbol');
    });
  });
});
