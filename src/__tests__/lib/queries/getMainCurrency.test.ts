import { DataSource } from 'typeorm';

import {
  Account,
  BankConfig,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import { getMainCurrency } from '@/lib/queries';

describe('getMainCurrency', () => {
  let eur: Commodity;
  let usd: Commodity;
  let rootAccount: Account;
  let datasource: DataSource;

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
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    usd = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    rootAccount = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('returns currency of root ASSET account', async () => {
    await Account.create({
      name: 'TICKER',
      type: 'EXPENSE',
      fk_commodity: usd,
      parent: rootAccount,
    }).save();

    await Account.create({
      name: 'TICKER',
      type: 'INCOME',
      fk_commodity: usd,
      parent: rootAccount,
    }).save();

    const assetRoot = await Account.create({
      name: 'TICKER',
      type: 'ASSET',
      fk_commodity: eur,
      parent: rootAccount,
    }).save();

    await Account.create({
      name: 'TICKER',
      type: 'ASSET',
      fk_commodity: usd,
      parent: assetRoot,
    }).save();

    const currency = await getMainCurrency();

    expect(currency).toEqual(eur);
  });

  it('throws error when no asset account', async () => {
    await expect(getMainCurrency()).rejects.toThrow('Could not find any entity');
  });
});
