import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
} from 'typeorm';

import { Commodity, Price } from '../../entities';
import PriceDBMap from '../../prices/PriceDBMap';

describe('PriceDBMap', () => {
  let instance: PriceDBMap;
  let commodityEur: Commodity;
  let commodityUsd: Commodity;
  let price1: Price;
  let price2: Price;

  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity],
      synchronize: true,
      logging: false,
    });

    commodityEur = await Commodity.create({
      guid: 'commodity_guid1',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    commodityUsd = await Commodity.create({
      guid: 'commodity_guid2',
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();

    price1 = Price.create({
      guid: 'price_guid_1',
      fk_commodity: commodityEur,
      fk_currency: commodityUsd,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 10,
      valueDenom: 100,
    });

    price2 = Price.create({
      guid: 'price_guid_2',
      fk_commodity: commodityUsd,
      fk_currency: commodityEur,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 20,
      valueDenom: 100,
    });
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  describe('instance', () => {
    beforeEach(() => {
      instance = new PriceDBMap([price1, price2]);
    });

    it('creates map as expected', () => {
      expect(instance.map).toEqual({
        'EUR.USD.2023-01-01': price1,
        'USD.EUR.2023-01-01': price2,
      });
    });

    it('raises error if commodity is not loaded', () => {
      expect(() => new PriceDBMap([
        Price.create({
          guid: 'price_guid_2',
          fk_commodity: 'commodity_guid1',
          fk_currency: commodityEur,
          date: DateTime.fromISO('2023-01-01'),
          valueNum: 20,
          valueDenom: 100,
        }),
      ])).toThrow('To create PriceDBMap');
    });

    it('raises error if currency is not loaded', () => {
      expect(() => new PriceDBMap([
        Price.create({
          guid: 'price_guid_2',
          fk_commodity: commodityUsd,
          fk_currency: 'commodity_guid1',
          date: DateTime.fromISO('2023-01-01'),
          valueNum: 20,
          valueDenom: 100,
        }),
      ])).toThrow('To create PriceDBMap');
    });
  });

  describe('getPrice', () => {
    it('returns dummy price with value 1 if from=to', () => {
      expect(instance.getPrice('EUR', 'EUR', DateTime.now())).toMatchObject({
        valueNum: 1,
        valueDenom: 1,
      });
    });

    it('returns matching price', () => {
      expect(instance.getPrice('EUR', 'USD', DateTime.fromISO('2023-01-01'))).toEqual(price1);
    });

    it('returns previous day when current not found', () => {
      expect(instance.getPrice('EUR', 'USD', DateTime.fromISO('2023-01-02'))).toEqual(price1);
    });

    it('returns next day when current not found', () => {
      expect(instance.getPrice('EUR', 'USD', DateTime.fromISO('2022-12-31'))).toEqual(price1);
    });

    it('raises an error if no matching price found', () => {
      expect(() => instance.getPrice('EUR', 'USD', DateTime.fromISO('2023-01-03'))).toThrow(
        'Price EUR.USD.2023-01-03 not found',
      );
    });
  });

  describe('getStockPrice', () => {
    beforeEach(async () => {
      const commodityStock = await Commodity.create({
        guid: 'commodity_guid2',
        namespace: '',
        mnemonic: 'STOCK',
      }).save();

      price1 = Price.create({
        guid: 'price_guid_1',
        fk_commodity: commodityStock,
        fk_currency: commodityUsd,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      });

      instance = new PriceDBMap([price1]);
    });

    it('returns matching price', () => {
      expect(instance.getStockPrice('STOCK', DateTime.fromISO('2023-01-01'))).toEqual(price1);
    });

    it('returns previous day when current not found', () => {
      expect(instance.getStockPrice('STOCK', DateTime.fromISO('2023-01-02'))).toEqual(price1);
    });

    it('raises an error if no matching price found', () => {
      expect(() => instance.getStockPrice('STOCK', DateTime.fromISO('2023-01-03'))).toThrow(
        'Price STOCK.2023-01-03 not found',
      );
    });
  });
});
