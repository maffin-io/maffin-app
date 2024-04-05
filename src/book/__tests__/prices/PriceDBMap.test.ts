import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import { Commodity, Price } from '../../entities';
import PriceDBMap from '../../prices/PriceDBMap';

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

    it('returns empty', () => {
      expect(instance.isEmpty).toBe(false);
      instance = new PriceDBMap();
      expect(instance.isEmpty).toBe(true);
    });

    it('creates map as expected', () => {
      expect(instance.map).toEqual({
        'EUR.USD': [price1],
        'USD.EUR': [price2],
      });
    });

    it('indexes stocks as expected', async () => {
      const ticker = await Commodity.create({
        namespace: 'STOCK',
        mnemonic: 'TICKER',
      }).save();

      price1 = Price.create({
        fk_commodity: ticker,
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      });

      price2 = Price.create({
        fk_commodity: ticker,
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-02'),
        valueNum: 20,
        valueDenom: 100,
      });

      instance = new PriceDBMap([price1, price2]);
      expect(instance.map).toEqual({
        TICKER: [price1, price2],
      });
    });
  });

  describe('getPrice', () => {
    beforeEach(() => {
      price1 = Price.create({
        guid: 'price1',
        fk_commodity: usd,
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      });

      price2 = Price.create({
        guid: 'price2',
        fk_commodity: usd,
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-03'),
        valueNum: 20,
        valueDenom: 100,
      });

      instance = new PriceDBMap([price1, price2]);
    });

    it('returns missing_price when no prices for the key', () => {
      expect(instance.getPrice('from', 'to').guid).toEqual('missing_price');
    });

    it('returns same_symbol when from === to', () => {
      expect(instance.getPrice('from', 'from').guid).toEqual('same_symbol');
    });

    it('returns price with matching date', () => {
      expect(instance.getPrice('USD', 'EUR', DateTime.fromISO('2023-01-01')).guid).toEqual('price1');
    });

    it('returns candidate with previous date when no current date', () => {
      expect(instance.getPrice('USD', 'EUR', DateTime.fromISO('2023-01-02')).guid).toEqual('price1');
    });

    it('returns future price when no other candidates', () => {
      expect(instance.getPrice('USD', 'EUR', DateTime.fromISO('2022-01-01')).guid).toEqual('price1');
    });

    it('returns latest price when no date passed', () => {
      expect(instance.getPrice('USD', 'EUR').guid).toEqual('price2');
    });
  });

  describe('getInvestmentPrice', () => {
    beforeEach(async () => {
      const commodityStock = await Commodity.create({
        namespace: 'STOCK',
        mnemonic: 'TICKER',
      }).save();

      price1 = Price.create({
        guid: 'price1',
        fk_commodity: commodityStock,
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      });

      price2 = Price.create({
        guid: 'price2',
        fk_commodity: commodityStock,
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-03'),
        valueNum: 10,
        valueDenom: 100,
      });

      instance = new PriceDBMap([price1, price2]);
    });

    it('returns missing_price when no prices for the key', () => {
      expect(instance.getInvestmentPrice('from').guid).toEqual('missing_price');
    });

    it('returns price with matching date', () => {
      expect(instance.getInvestmentPrice('TICKER', DateTime.fromISO('2023-01-01')).guid).toEqual('price1');
    });

    it('returns candidate with previous date when no current date', () => {
      expect(instance.getInvestmentPrice('TICKER', DateTime.fromISO('2023-01-02')).guid).toEqual('price1');
    });

    it('returns future price when no other candidates', () => {
      expect(instance.getInvestmentPrice('TICKER', DateTime.fromISO('2022-01-01')).guid).toEqual('price1');
    });

    it('returns latest price when no date passed', () => {
      expect(instance.getInvestmentPrice('TICKER').guid).toEqual('price2');
    });
  });
});
