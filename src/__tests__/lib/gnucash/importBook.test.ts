import { DataSource } from 'typeorm';

import { importBook } from '@/lib/gnucash';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';

describe('importBook', () => {
  let datasource: DataSource;
  let root: Account;
  let eur: Commodity;

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
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    const assetsAccount = await Account.create({
      name: 'Assets',
      type: 'ASSET',
      parent: root,
      fk_commodity: eur,
    }).save();

    await Account.create({
      name: 'Bank',
      type: 'BANK',
      parent: assetsAccount,
      fk_commodity: eur,
    }).save();
  });

  /**
   * The Root Template account gets created by gnucash automatically
   * but we don't use it and makes it complicated to retrieve the root
   * account of the book so we delete it
   */
  it('deletes Root Template account', async () => {
    const templateRoot = await Account.create({
      name: 'Template Root',
      // We need to do this hack and update later
      // as we can't create two Roots due to validation
      type: 'LIABILITY',
      fk_commodity: eur,
      parent: root,
    }).save();
    await Account.update(
      { guid: templateRoot.guid },
      { type: 'ROOT', parent: undefined },
    );

    const rawBook = await importBook(datasource.sqljsManager.exportDatabase());

    const ds = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await ds.initialize();
    await ds.sqljsManager.loadDatabase(rawBook);

    const accounts = await ds.getRepository(Account).findBy({
      type: 'ROOT',
    });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toEqual('Root');
  });
});
