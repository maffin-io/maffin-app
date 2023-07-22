import { DataSource } from 'typeorm';

import {
  Account,
  Book,
  Commodity,
  Split,
  Transaction,
} from '../../entities';
import { getAccountsWithPath } from '../../queries';

describe('getAbsolutePaths', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Book, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    const root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    await Book.create({
      fk_root: root,
    }).save();

    const parentAccount = await Account.create({
      name: 'Parent',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    await Account.create({
      name: 'Child',
      type: 'ASSET',
      fk_commodity: eur,
      parent: parentAccount,
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('returns absolute paths for accounts ignoring root', async () => {
    const accounts = await getAccountsWithPath();

    expect(accounts).toEqual([
      {
        fk_commodity: {
          cusip: null,
          guid: expect.any(String),
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
        guid: expect.any(String),
        childrenIds: [expect.any(String)],
        name: 'Parent',
        path: 'Parent',
        type: 'ASSET',
      },
      {
        fk_commodity: {
          cusip: null,
          guid: expect.any(String),
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
        guid: expect.any(String),
        childrenIds: [],
        name: 'Child',
        path: 'Parent:Child',
        type: 'ASSET',
      },
    ]);
  });

  it('returns root when specified', async () => {
    const accounts = await getAccountsWithPath({ showRoot: true });

    expect(accounts).toHaveLength(3);
    expect(accounts[0]).toMatchObject({
      name: 'Root',
      type: 'ROOT',
      fk_commodity: null,
      path: 'Root',
    });
  });

  it('returns with loaded relations', async () => {
    const accounts = await getAccountsWithPath({ relations: { splits: true } });

    expect(accounts[0]).toHaveProperty('splits');
  });
});
