import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
  BaseEntity,
} from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '../../entities';

describe('Price', () => {
  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity, Account, Split, Transaction],
      synchronize: true,
      logging: false,
    });
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  describe('Entity', () => {
    beforeEach(async () => {
      await Commodity.create({
        guid: 'commodity_guid1',
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      await Commodity.create({
        guid: 'commodity_guid2',
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      await Price.create({
        guid: 'price1_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      }).save();
    });

    it('is active record', async () => {
      const prices = await Price.find();
      expect(prices[0]).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve price entry', async () => {
      const prices = await Price.find();

      expect(prices[0].guid).toEqual('price1_guid');
      expect(prices[0].date.toISODate()).toEqual('2023-01-01');
      expect(prices[0].commodity.guid).toEqual('commodity_guid1');
      expect(prices[0].currency.guid).toEqual('commodity_guid2');
    });

    it('calculates value', async () => {
      const prices = await Price.find();
      expect(prices[0].value).toEqual(0.1);
    });

    it('returns quote info when available', async () => {
      await Price.create({
        guid: 'price1_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
        date: DateTime.fromISO('2023-01-01'),
        source: `maffin::${JSON.stringify({
          changeAbs: 10.1,
          changePct: 1.1,
        })}`,
        valueNum: 10,
        valueDenom: 100,
      }).save();

      const prices = await Price.find();

      expect(prices[0].quoteInfo).toEqual({
        changeAbs: 10.1,
        changePct: 1.1,
      });
    });
  });
});
