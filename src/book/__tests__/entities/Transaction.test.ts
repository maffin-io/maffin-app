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

describe('Transaction', () => {
  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity, Split, Transaction, Account],
      synchronize: true,
      logging: false,
    });

    await Commodity.create({
      guid: 'currency_guid',
      namespace: 'namespace',
      mnemonic: 'EUR',
    }).save();

    await Transaction.create({
      guid: 'tx_guid',
      fk_currency: 'currency_guid',
      date: DateTime.fromISO('2023-01-01'),
    }).save();
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('is active record', async () => {
    const instance = await Transaction.find();
    expect(instance[0]).toBeInstanceOf(BaseEntity);
  });

  it('can retrieve transaction', async () => {
    const transactions = await Transaction.find({
      relations: ['splits'],
    });

    expect(transactions[0].guid).toEqual('tx_guid');
  });

  it('retrieves splits', async () => {
    await Account.create({
      guid: 'account_guid',
      name: 'name',
      type: 'ASSET',
      fk_commodity: 'currency_guid',
    }).save();

    const split = Split.create({
      guid: 'split_guid',
      valueNum: 10,
      valueDenom: 100,
      quantityNum: 15,
      quantityDenom: 100,
      fk_transaction: 'tx_guid',
      fk_account: 'account_guid',
    });

    await split.save();

    const instance = await Transaction.find({
      relations: ['splits'],
    });
    const txSplits = instance[0].splits;

    expect(txSplits).toHaveLength(1);
    expect(txSplits[0].guid).toEqual('split_guid');
  });
});
