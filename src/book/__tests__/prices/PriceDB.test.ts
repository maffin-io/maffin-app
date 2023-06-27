import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
} from 'typeorm';
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

  describe('getRate', () => {
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
        guid: 'price2_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD');

      expect(rate.toString()).toEqual('0.20 USD');
    });

    it('returns rate for specific date', async () => {
      await Price.create({
        guid: 'price2_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD', DateTime.fromISO('2023-01-01'));
      expect(rate.toString()).toEqual('0.10 USD');
    });

    it('returns rate for specific date when -1 day exists', async () => {
      await Price.create({
        guid: 'price2_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
        date: DateTime.fromISO('2023-02-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      const rate = await PriceDB.getRate('EUR', 'USD', DateTime.fromISO('2023-02-02'));
      expect(rate.toString()).toEqual('0.20 USD');
    });

    it('returns rate for specific date when +1 day exists', async () => {
      await Price.create({
        guid: 'price2_guid',
        fk_commodity: 'commodity_guid1',
        fk_currency: 'commodity_guid2',
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
        guid: 'commodity_guid1',
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      await Commodity.create({
        guid: 'commodity_guid2',
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
            guid: 'commodity_guid1',
          },
          fk_currency: {
            guid: 'commodity_guid2',
          },
          guid: expect.any(String),
          source: 'maffin::{"price":0.9654,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          valueDenom: 10000,
          valueNum: 9654,
        },
        [`USD.EUR.${DateTime.now().toISODate()}`]: {
          date: expect.any(DateTime),
          fk_commodity: {
            guid: 'commodity_guid2',
          },
          fk_currency: {
            guid: 'commodity_guid1',
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
            commodity: {
              cusip: null,
              guid: 'commodity_guid1',
              mnemonic: 'EUR',
              namespace: 'CURRENCY',
            },
            currency: {
              cusip: null,
              guid: 'commodity_guid2',
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
            commodity: {
              cusip: null,
              guid: 'commodity_guid2',
              mnemonic: 'USD',
              namespace: 'CURRENCY',
            },
            currency: {
              cusip: null,
              guid: 'commodity_guid1',
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

      await Commodity.create({
        guid: 'commodity_googl',
        namespace: 'NASDAQ',
        mnemonic: 'GOOGL',
      }).save();

      await Commodity.create({
        guid: 'commodity_usd',
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      await Account.create({
        guid: 'googl_account',
        name: 'GOOGL',
        type,
        fk_commodity: 'commodity_googl',
      }).save();

      await Transaction.create({
        guid: 'tx_guid_1',
        fk_currency: 'commodity_usd',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      await Split.create({
        guid: 'guid_1',
        valueNum: 10,
        valueDenom: 100,
        quantityNum: 200,
        quantityDenom: 100,
        fk_transaction: 'tx_guid_1',
        fk_account: 'googl_account',
      }).save();
    });

    it('returns Price with quoteinfo', async () => {
      const today = await PriceDB.getTodayQuotes();

      expect(today.map).toMatchObject({
        [`GOOGL.${DateTime.now().toISODate()}`]: {
          date: expect.any(DateTime),
          fk_commodity: {
            guid: 'commodity_googl',
          },
          fk_currency: {
            guid: 'commodity_usd',
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
            commodity: {
              guid: 'commodity_googl',
              cusip: null,
              mnemonic: 'GOOGL',
              namespace: 'NASDAQ',
            },
            currency: {
              guid: 'commodity_usd',
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

      await Commodity.create({
        guid: 'commodity_guid3',
        namespace: 'CURRENCY',
        mnemonic: 'SGD',
      }).save();

      await Price.create({
        guid: 'price_guid_1',
        fk_commodity: 'commodity_guid2',
        fk_currency: 'commodity_guid1',
        date: DateTime.fromISO('2021-01-01'),
        valueNum: 10,
        valueDenom: 100,
      }).save();

      await Price.create({
        guid: 'price_guid_2',
        fk_commodity: 'commodity_guid2',
        fk_currency: 'commodity_guid1',
        date: DateTime.fromISO('2022-01-01'),
        valueNum: 20,
        valueDenom: 100,
      }).save();

      await Price.create({
        guid: 'price_guid_3',
        fk_commodity: 'commodity_guid3',
        fk_currency: 'commodity_guid1',
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 30,
        valueDenom: 100,
      }).save();
    });

    it('retrieves all prices as expected', async () => {
      const prices = await PriceDB.getHistory('EUR');

      expect(prices.map).toEqual({
        'SGD.EUR.2023-01-01': expect.objectContaining({
          guid: 'price_guid_3',
        }),
        'USD.EUR.2021-01-01': expect.objectContaining({
          guid: 'price_guid_1',
        }),
        'USD.EUR.2022-01-01': expect.objectContaining({
          guid: 'price_guid_2',
        }),
      });
    });
  });
});
