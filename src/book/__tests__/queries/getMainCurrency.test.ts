import {
  createConnection,
  getConnection,
} from 'typeorm';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '../../entities';
import { getMainCurrency } from '../../queries';

describe('getMainCurrency', () => {
  let eur: Commodity;
  let rootAccount: Account;

  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity, Account, Split, Transaction],
      synchronize: true,
      logging: false,
    });

    eur = await Commodity.create({
      guid: 'eur_guid',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    await Commodity.create({
      guid: 'usd_guid',
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    rootAccount = await Account.create({
      guid: 'root_account_guid',
      name: 'Root account',
      type: 'ROOT',
    }).save();
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('returns the currency with most expenses/income accounts', async () => {
    await Account.create({
      guid: 'account_guid_1',
      name: 'TICKER',
      type: 'EXPENSE',
      fk_commodity: 'eur_guid',
      parent: rootAccount,
    }).save();

    await Account.create({
      guid: 'account_guid_2',
      name: 'TICKER',
      type: 'INCOME',
      fk_commodity: 'eur_guid',
      parent: rootAccount,
    }).save();

    await Account.create({
      guid: 'account_guid_3',
      name: 'TICKER',
      type: 'INCOME',
      fk_commodity: 'usd_guid',
      parent: rootAccount,
    }).save();

    await Account.create({
      guid: 'account_guid_4',
      name: 'TICKER',
      type: 'ASSET',
      fk_commodity: 'usd_guid',
      parent: rootAccount,
    }).save();

    await Account.create({
      guid: 'account_guid_5',
      name: 'TICKER',
      type: 'ASSET',
      fk_commodity: 'usd_guid',
      parent: rootAccount,
    }).save();

    await Account.create({
      guid: 'account_guid_6',
      name: 'TICKER',
      type: 'ASSET',
      fk_commodity: 'usd_guid',
      parent: rootAccount,
    }).save();

    const currency = await getMainCurrency();

    expect(currency).toEqual(eur);
  });

  it('throws error when no main currency', async () => {
    await expect(getMainCurrency()).rejects.toThrow('Not enough accounts');
  });
});
