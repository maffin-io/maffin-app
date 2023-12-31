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
      guid: 'abcdef',
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    await Account.create({
      guid: 'ghijk',
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

    expect(accounts.type_root.guid).toEqual('a');
    expect(accounts.a.guid).toEqual('a');
    expect(accounts.type_asset.guid).toEqual('abcdef');
    expect(accounts.type_expense.guid).toEqual('ghijk');
    expect(accounts.abcdef.guid).toEqual('abcdef');
    expect(accounts.ghijk.guid).toEqual('ghijk');
  });
});
