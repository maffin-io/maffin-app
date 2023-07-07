import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';
import crypto from 'crypto';

import { Commodity, Price } from '../../entities';
import PriceDBMap from '../../prices/PriceDBMap';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('PriceDBMap', () => {
  let datasource: DataSource;
  let instance: PriceDBMap;
  let eur: Commodity;
  let usd: Commodity;
  let price1: Price;
  let price2: Price;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity],
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

    price1 = Price.create({
      fk_commodity: eur,
      fk_currency: usd,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 10,
      valueDenom: 100,
    });

    price2 = Price.create({
      fk_commodity: usd,
      fk_currency: eur,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 20,
      valueDenom: 100,
    });
  });

  afterEach(async () => {
    await datasource.destroy();
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
          fk_commodity: 'foo',
          fk_currency: eur,
          date: DateTime.fromISO('2023-01-01'),
          valueNum: 20,
          valueDenom: 100,
        }),
      ])).toThrow('To create PriceDBMap');
    });

    it('raises error if currency is not loaded', () => {
      expect(() => new PriceDBMap([
        Price.create({
          fk_commodity: usd,
          fk_currency: 'foo',
          date: DateTime.fromISO('2023-01-01'),
          valueNum: 20,
          valueDenom: 100,
        }),
      ])).toThrow('To create PriceDBMap');
    });
  });

  describe('getPrice', () => {
    beforeEach(() => {
      instance = new PriceDBMap([price1, price2]);
    });

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
        namespace: 'AS',
        mnemonic: 'STOCK',
      }).save();

      price1 = Price.create({
        fk_commodity: commodityStock,
        fk_currency: usd,
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
