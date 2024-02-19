import { waitFor } from '@testing-library/react';
import { DataSource, BaseEntity as BE } from 'typeorm';

import {
  Account,
  Commodity,
  Split,
  Transaction,
  BaseEntity,
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
    jest.clearAllMocks();
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

      // eslint-disable-next-line testing-library/no-node-access
      expect(rootAccount.children[0].guid).toEqual(account.guid);
      // eslint-disable-next-line testing-library/no-node-access
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
        name: '',
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
        type: 'INVESTMENT',
        parent: root,
        fk_commodity: eur,
      });

      await expect(account.save()).rejects.toThrow('checkInvestmentCommodity');
    });

    it.each([
      'INCOME',
      'EXPENSE',
    ])('fails if different commodity than parent for %s', async (type) => {
      account2 = await Account.create({
        name: 'Name',
        type,
        parent: root,
        fk_commodity: eur,
      }).save();

      const usd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();
      account = Account.create({
        name: 'name',
        type,
        parent: account2,
        fk_commodity: usd,
      });

      await expect(account.save()).rejects.toThrow('checkIECommodity');
    });
  });
});

describe('caching', () => {
  let mockSetQueryData: jest.Mock;
  let datasource: DataSource;
  let root: Account;
  let eur: Commodity;

  beforeEach(async () => {
    mockSetQueryData = jest.fn()
      .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
        if (callback instanceof Function) {
          return callback(undefined);
        }

        return root;
      })
      .mockName('setQueryData');

    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
      extra: {
        queryClient: {
          setQueryData: mockSetQueryData,
        },
      },
    });
    await datasource.initialize();

    eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    // @ts-ignore
    jest.spyOn(BaseEntity.prototype, 'save').mockImplementation(BE.prototype.save);
    // @ts-ignore
    jest.spyOn(BaseEntity.prototype, 'remove').mockImplementation(BE.prototype.remove);

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty accounts map when /api/accounts is undefined', async () => {
    await waitFor(() => expect(mockSetQueryData.mock.results[0].value).toBeUndefined());
  });

  it('adds account to parent childrenIds /api/accounts', async () => {
    mockSetQueryData
      .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
        if (callback instanceof Function) {
          return callback([root]);
        }

        return root;
      })
      .mockName('setQueryData');

    // Wait for the first updateCache to execute so we don't have race conditions
    await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(1));

    const account = await Account.create({
      name: 'name',
      type: 'ASSET',
      parent: root,
      fk_commodity: eur,
    }).save();

    await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(2));
    const result = mockSetQueryData.mock.results[1].value;
    expect(result[0].childrenIds).toContain(account.guid);
  });

  it('deletes account in /api/accounts', async () => {
    mockSetQueryData
      .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
        if (callback instanceof Function) {
          return callback([root]);
        }

        return root;
      })
      .mockName('setQueryData');

    const account = await Account.create({
      name: 'name',
      type: 'ASSET',
      parent: root,
      fk_commodity: eur,
    }).save();

    await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(2));

    await account.remove();

    await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(3));
    const result = mockSetQueryData.mock.results[2].value;
    expect(result[0].childrenIds).toHaveLength(0);
  });
});
