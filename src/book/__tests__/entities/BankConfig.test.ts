import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Split,
  Transaction,
  BankConfig,
} from '../../entities';

describe('BankConfig', () => {
  let datasource: DataSource;
  let account: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction, BankConfig],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    account = await Account.create({
      name: 'Account',
      type: 'ASSET',
      parent: root,
      fk_commodity: Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }),
    }).save();
  });

  // https://github.com/typeorm/typeorm/issues/10917
  it.failing('saves config with account', async () => {
    await BankConfig.create({
      guid: 'inst_id',
      token: 'token',
      accounts: [account],
    }).save();
  });
});
