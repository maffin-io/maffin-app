import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
  BaseEntity,
} from 'typeorm';

import {
  Commodity,
  Transaction,
  Split,
  Account,
} from '../../entities';

describe('Split', () => {
  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Split, Transaction, Commodity],
      synchronize: true,
      logging: false,
    });

    await Commodity.create({
      guid: 'commodity_guid',
      namespace: 'namespace',
      mnemonic: 'EUR',
    }).save();

    await Account.create({
      guid: 'account_guid',
      name: 'name',
      type: 'ASSET',
      fk_commodity: 'commodity_guid',
    }).save();

    await Transaction.create({
      guid: 'tx_guid',
      fk_currency: 'commodity_guid',
      date: DateTime.fromISO('2023-01-01'),
    }).save();

    await Split.create({
      guid: 'guid',
      valueNum: 10,
      valueDenom: 100,
      action: 'whatever',
      quantityNum: 15,
      quantityDenom: 100,
      fk_transaction: 'tx_guid',
      fk_account: 'account_guid',
    }).save();
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('is active record', async () => {
    const splits = await Split.find();
    expect(splits[0]).toBeInstanceOf(BaseEntity);
  });

  it('can retrieve split', async () => {
    const split = (await Split.find({ relations: ['fk_account', 'fk_transaction'] }))[0];

    expect(split).toMatchObject({
      guid: 'guid',
      valueNum: 10,
      valueDenom: 100,
      action: 'whatever',
      quantityNum: 15,
      quantityDenom: 100,
    });
    expect(split.account.guid).toEqual('account_guid');
    expect(split.transaction.guid).toEqual('tx_guid');
  });

  it('calculates value', async () => {
    const splits = await Split.find();
    expect(splits[0].value).toEqual(0.1);
  });

  it('calculates quantity', async () => {
    const splits = await Split.find();
    expect(splits[0].quantity).toEqual(0.15);
  });
});
