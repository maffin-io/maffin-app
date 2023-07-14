import { DateTime } from 'luxon';
import { DataSource, BaseEntity } from 'typeorm';
import crypto from 'crypto';

import {
  Commodity,
  Price,
} from '../../entities';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('Price', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('Entity', () => {
    let commodity1: Commodity;
    let commodity2: Commodity;

    beforeEach(async () => {
      commodity1 = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      commodity2 = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      await Price.create({
        fk_commodity: commodity1,
        fk_currency: commodity2,
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

      expect(prices[0].date.toISODate()).toEqual('2023-01-01');
      expect(prices[0].commodity.mnemonic).toEqual('EUR');
      expect(prices[0].currency.mnemonic).toEqual('USD');
    });

    it('calculates value', async () => {
      const prices = await Price.find();
      expect(prices[0].value).toEqual(0.1);
    });

    it('returns quote info when available', async () => {
      await Price.create({
        fk_commodity: commodity1,
        fk_currency: commodity2,
        date: DateTime.fromISO('2023-01-02'),
        source: `maffin::${JSON.stringify({
          changeAbs: 10.1,
          changePct: 1.1,
        })}`,
        valueNum: 10,
        valueDenom: 100,
      }).save();

      const prices = await Price.find();

      expect(prices[1].quoteInfo).toEqual({
        changeAbs: 10.1,
        changePct: 1.1,
      });
    });
  });
});
