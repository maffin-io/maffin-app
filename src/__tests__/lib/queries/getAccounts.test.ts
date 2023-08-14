import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getAccounts } from '@/lib/queries';

describe('getAccounts', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    const root = await Account.create({
      guid: 'a',
      type: 'ROOT',
      name: 'Root',
    }).save();

    await Account.create({
      guid: 'assets',
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    await Account.create({
      guid: 'expenses',
      name: 'Expenses',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('returns accounts as expected', async () => {
    const accounts = await getAccounts();

    expect(accounts.root.guid).toEqual('a');
    expect(accounts.assets.guid).toEqual('assets');
    expect(accounts.expenses.guid).toEqual('expenses');
  });
});
