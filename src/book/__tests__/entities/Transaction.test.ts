import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  BaseEntity,
  Commodity,
  Transaction,
  Split,
  Account,
} from '../../entities';

describe('Transaction', () => {
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

  describe('entity', () => {
    beforeEach(async () => {
      account2 = await Account.create({
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
    });

    it('is active record', async () => {
      const instance = await Transaction.find();
      expect(instance[0]).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve transaction', async () => {
      const transactions = await Transaction.find();
      expect(transactions[0].description).toEqual('description');
    });

    it('retrieves splits', async () => {
      const instance = await Transaction.find({
        relations: ['splits'],
      });
      const txSplits = instance[0].splits;

      expect(txSplits).toHaveLength(2);
    });
  });

  describe('validation', () => {
    it('fails if description not long enough', async () => {
      const tx = Transaction.create({
        description: 'des',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
      });

      await expect(tx.save()).rejects.toThrow('isLength');
    });

    it('fails if date is empty', async () => {
      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
      });

      await expect(tx.save()).rejects.toThrow('isNotEmpty');
    });

    it('fails if currency is empty', async () => {
      const tx = Transaction.create({
        description: 'description',
        date: DateTime.fromISO('2023-01-01'),
      });

      await expect(tx.save()).rejects.toThrow('isNotEmpty');
    });

    it('validates nested splits', async () => {
      const split1 = new Split();
      const split2 = new Split();

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1, split2],
      });

      await expect(tx.save()).rejects.toThrow();
    });

    it('fails if not enough splits', async () => {
      const split1 = new Split();
      split1.fk_account = account;

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1],
      });

      await expect(tx.save()).rejects.toThrow('splitsNum');
    });

    it('can create tx with 1 split if Investment', async () => {
      const commodity = await Commodity.create({
        namespace: 'NASDAQ',
        mnemonic: 'GOOGL',
      }).save();

      const split1 = new Split();
      split1.value = 10;
      split1.quantity = 100;
      split1.fk_account = await Account.create({
        name: 'GOOGL',
        type: 'STOCK',
        fk_commodity: commodity,
        parent: account,
      }).save();

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1],
      });

      await expect(tx.save()).resolves.not.toThrow();
    });

    it('fails if splits value balance != 0', async () => {
      const split1 = new Split();
      split1.value = 100;
      split1.fk_account = account;
      const split2 = new Split();
      split2.value = 200;
      split2.fk_account = account2;

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1, split2],
      });

      await expect(tx.save()).rejects.toThrow('splitsBalance');
    });

    it('doesnt fail when floating point error', async () => {
      const split1 = new Split();
      split1.value = -86.56;
      split1.fk_account = account;
      const split2 = new Split();
      split2.value = 55;
      split2.fk_account = account2;
      const split3 = new Split();
      split3.value = 31.56;
      split3.fk_account = Account.create({
        name: 'Expenses2',
        type: 'EXPENSE',
        parent: root,
        fk_commodity: eur,
      });

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1, split2, split3],
      });

      await expect(tx.save()).rejects.not.toThrow('splitsBalance');
    });

    it('fails if splits have duplicated accounts', async () => {
      const split1 = new Split();
      split1.fk_account = account;
      const split2 = new Split();
      split2.fk_account = account;

      const tx = Transaction.create({
        description: 'description',
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        splits: [split1, split2],
      });

      await expect(tx.save()).rejects.toThrow('splitsDuplicateAccounts');
    });
  });
});
