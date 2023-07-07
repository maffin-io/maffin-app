import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';
import crypto from 'crypto';

import { PriceDB } from '../../prices';
import {
  Account,
  Transaction,
  Commodity,
  Price,
  Split,
} from '../../entities';
import Stocker from '../../../apis/Stocker';
import { toFixed } from '../../../helpers/number';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('PriceDB', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity, Account, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  describe('getRate', () => {
    let eur: Commodity;
    let usd: Commodity;

    beforeEach(async () => {
      eur = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      usd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      await Price.create({
        fk_commodity: eur,
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      }).save();
    });

    it('returns 1 if same', async () => {
      const rate = await PriceDB.getRate('EUR', 'EUR');

      expect(rate.toString()).toEqual('1.00 EUR');
    });

    it('can retrieve rate', async () => {
      const rate = await PriceDB.getRate('EUR', 'USD');

      expect(rate.toString()).toEqual('0.10 USD');
    });

    it('returns the latest by default', async () => {
      await Price.create({
        fk_commodity: eur,
        fk_currency: usd,
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD');

      expect(rate.toString()).toEqual('0.20 USD');
    });

    it('returns rate for specific date', async () => {
      await Price.create({
        fk_commodity: eur,
        fk_currency: usd,
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD', DateTime.fromISO('2023-01-01'));
      expect(rate.toString()).toEqual('0.10 USD');
    });

    it('returns rate for specific date when -1 day exists', async () => {
      await Price.create({
        fk_commodity: eur,
        fk_currency: usd,
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD', DateTime.fromISO('2023-02-02'));
      expect(rate.toString()).toEqual('0.20 USD');
    });

    it('returns rate for specific date when +1 day exists', async () => {
      await Price.create({
        fk_commodity: eur,
        fk_currency: usd,
        date: DateTime.fromISO('2023-02-02'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD', DateTime.fromISO('2023-02-01'));
      expect(rate.toString()).toEqual('0.20 USD');
    });

    it('fails if rate not found', async () => {
      await expect(() => PriceDB.getRate('USD', 'EUR')).rejects.toThrow('Could not find any entity of type');
    });

    it('fails if rate with date not found', async () => {
      await expect(() => PriceDB.getRate('EUR', 'USD', DateTime.now())).rejects.toThrow('Could not find any entity of type');
    });
  });

  describe('getQuotes currency', () => {
    let mockGetPrices = jest.fn() as jest.SpyInstance;

    beforeEach(async () => {
      mockGetPrices = jest.spyOn(Stocker.prototype, 'getLiveSummary').mockResolvedValue({
        'EURUSD=X': {
          price: 0.9654,
          changePct: -1,
          changeAbs: -1,
          currency: 'USD',
        },
        'USDEUR=X': {
          price: toFixed(1 / 0.9654),
          changePct: -1,
          changeAbs: -1,
          currency: 'EUR',
        },
      });

      await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();
    });

    it('returns Price with quoteinfo', async () => {
      const today = await PriceDB.getTodayQuotes();

      expect(today.map).toMatchObject({
        [`EUR.USD.${DateTime.now().toISODate()}`]: {
          date: expect.any(DateTime),
          fk_commodity: {
            mnemonic: 'EUR',
          },
          fk_currency: {
            mnemonic: 'USD',
          },
          guid: expect.any(String),
          source: 'maffin::{"price":0.9654,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          valueDenom: 10000,
          valueNum: 9654,
        },
        [`USD.EUR.${DateTime.now().toISODate()}`]: {
          date: expect.any(DateTime),
          fk_commodity: {
            mnemonic: 'USD',
          },
          fk_currency: {
            mnemonic: 'EUR',
          },
          source: 'maffin::{"price":1.04,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          guid: expect.any(String),
          valueDenom: 100,
          valueNum: 104,
        },
      });
    });

    it('upserts Price', async () => {
      const mockUpsert = jest.spyOn(Price, 'upsert').mockImplementation();
      await PriceDB.getTodayQuotes();

      expect(mockGetPrices).toHaveBeenCalledWith(['EURUSD=X', 'USDEUR=X']);
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            guid: expect.any(String),
            date: DateTime.now().startOf('day'),
            valueNum: 9654,
            valueDenom: 10000,
            fk_commodity: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'EUR',
              namespace: 'CURRENCY',
            },
            fk_currency: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'USD',
              namespace: 'CURRENCY',
            },
            source: 'maffin::{"price":0.9654,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          }),
          expect.objectContaining({
            guid: expect.any(String),
            date: DateTime.now().startOf('day'),
            valueNum: 104,
            valueDenom: 100,
            fk_commodity: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'USD',
              namespace: 'CURRENCY',
            },
            fk_currency: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'EUR',
              namespace: 'CURRENCY',
            },
            source: 'maffin::{"price":1.04,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          }),
        ],
        { conflictPaths: ['fk_commodity', 'fk_currency', 'date'] },
      );
    });
  });

  describe.each(
    ['STOCK', 'MUTUAL'],
  )('getQuotes %s', (type) => {
    let mockGetPrices = jest.fn() as jest.SpyInstance;

    beforeEach(async () => {
      mockGetPrices = jest.spyOn(Stocker.prototype, 'getLiveSummary').mockResolvedValue({
        GOOGL: {
          price: 2000,
          changePct: -1,
          changeAbs: -1,
          currency: 'USD',
        },
      });

      const commodity = await Commodity.create({
        namespace: 'NASDAQ',
        mnemonic: 'GOOGL',
      }).save();

      const usd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      const root = await Account.create({
        name: 'Root',
        type: 'ROOT',
      }).save();

      const parent = await Account.create({
        name: 'Parent',
        type: 'ASSET',
        parent: root,
        fk_commodity: usd,
      }).save();

      const investment = await Account.create({
        name: 'GOOGL',
        type,
        fk_commodity: commodity,
        parent,
      }).save();

      const broker = await Account.create({
        name: 'broker',
        type: 'ASSET',
        fk_commodity: usd,
        parent,
      }).save();

      await Transaction.create({
        description: 'description',
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-01'),
        splits: [
          {
            valueNum: -10,
            valueDenom: 100,
            quantityNum: -200,
            quantityDenom: 100,
            fk_account: broker,
          },
          {
            valueNum: 10,
            valueDenom: 100,
            quantityNum: 200,
            quantityDenom: 100,
            fk_account: investment,
          },
        ],
      }).save();
    });

    it('returns Price with quoteinfo', async () => {
      const today = await PriceDB.getTodayQuotes();

      expect(today.map).toMatchObject({
        [`GOOGL.${DateTime.now().toISODate()}`]: {
          date: expect.any(DateTime),
          fk_commodity: {
            mnemonic: 'GOOGL',
          },
          fk_currency: {
            mnemonic: 'USD',
          },
          guid: expect.any(String),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          valueDenom: 1,
          valueNum: 2000,
        },
      });
    });

    it('upserts Price', async () => {
      const mockUpsert = jest.spyOn(Price, 'upsert').mockImplementation();
      await PriceDB.getTodayQuotes();

      expect(mockGetPrices).toHaveBeenCalledWith(['GOOGL']);
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            guid: expect.any(String),
            date: DateTime.now().startOf('day'),
            valueNum: 2000,
            valueDenom: 1,
            fk_commodity: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'GOOGL',
              namespace: 'NASDAQ',
            },
            fk_currency: {
              guid: expect.any(String),
              cusip: null,
              mnemonic: 'USD',
              namespace: 'CURRENCY',
            },
            source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          }),
        ],
        { conflictPaths: ['fk_commodity', 'fk_currency', 'date'] },
      );
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      const eur = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      const usd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      const sgd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'SGD',
      }).save();

      await Price.create({
        fk_commodity: usd,
        fk_currency: eur,
        date: DateTime.fromISO('2021-01-01'),
        valueNum: 10,
        valueDenom: 100,
      }).save();

      await Price.create({
        fk_commodity: usd,
        fk_currency: eur,
        date: DateTime.fromISO('2022-01-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      await Price.create({
        fk_commodity: sgd,
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 30,
        valueDenom: 100,
      }).save();
    });

    it('retrieves all prices as expected', async () => {
      const prices = await PriceDB.getHistory('EUR');

      expect(prices.map).toEqual({
        'SGD.EUR.2023-01-01': expect.objectContaining({
          valueNum: 30,
          valueDenom: 100,
        }),
        'USD.EUR.2021-01-01': expect.objectContaining({
          valueNum: 10,
          valueDenom: 100,
        }),
        'USD.EUR.2022-01-01': expect.objectContaining({
          valueNum: 20,
          valueDenom: 100,
        }),
      });
    });
  });
});
