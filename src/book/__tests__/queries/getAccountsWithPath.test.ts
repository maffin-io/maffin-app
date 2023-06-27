import {
  createConnection,
  getConnection,
} from 'typeorm';

import {
  Account,
  Book,
  Commodity,
  Split,
  Transaction,
} from '../../entities';
import { getAccountsWithPath } from '../../queries';

describe('getAbsolutePaths', () => {
  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Book, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });

    await Commodity.create({
      guid: 'eur_guid',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    const root = await Account.create({
      guid: 'root_account_guid',
      name: 'Root account',
      type: 'ROOT',
    }).save();

    await Book.create({
      guid: 'book_guid',
      fk_root: root,
    }).save();

    const parentAccount = await Account.create({
      guid: 'parent_account_guid',
      name: 'Parent account',
      type: 'ASSET',
      fk_commodity: 'eur_guid',
      parent: root,
    }).save();

    await Account.create({
      guid: 'child_account_guid',
      name: 'Child account',
      type: 'ASSET',
      fk_commodity: 'eur_guid',
      parent: parentAccount,
    }).save();
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('returns absolute paths for accounts ignoring root', async () => {
    const accounts = await getAccountsWithPath();

    expect(accounts).toEqual([
      {
        fk_commodity: {
          cusip: null,
          guid: 'eur_guid',
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
        guid: 'parent_account_guid',
        name: 'Parent account',
        path: 'Parent account',
        type: 'ASSET',
      },
      {
        fk_commodity: {
          cusip: null,
          guid: 'eur_guid',
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
        guid: 'child_account_guid',
        name: 'Child account',
        path: 'Parent account:Child account',
        type: 'ASSET',
      },
    ]);
  });
});
