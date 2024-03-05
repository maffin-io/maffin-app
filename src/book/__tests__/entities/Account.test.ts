import { DataSource } from 'typeorm';

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

    it('fails if placeholder with splits', async () => {
      await Split.create({
        fk_account: account,
        valueNum: 1,
        valueDenom: 1,
        quantityNum: 1,
        quantityDenom: 1,
      }).save();

      account.placeholder = true;

      await expect(account.save()).rejects.toThrow('checkPlaceholder');
    });
  });
});

describe('caching', () => {
  let datasource: DataSource;
  let mockInvalidateQueries: jest.Mock;

  beforeEach(async () => {
    mockInvalidateQueries = jest.fn();

    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
      extra: {
        queryClient: {
          invalidateQueries: mockInvalidateQueries,
        },
      },
    });
    await datasource.initialize();

    jest.spyOn(BaseEntity.prototype, 'save').mockImplementation();
    jest.spyOn(BaseEntity.prototype, 'remove').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates keys when saving', async () => {
    const acc = new Account();
    acc.name = 'name';

    await acc.save();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'accounts'],
    });
  });

  it('invalidates keys when deleting', async () => {
    const acc = new Account();
    acc.name = 'name';

    await acc.remove();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'accounts'],
    });
  });
});
