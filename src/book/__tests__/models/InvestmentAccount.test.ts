import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import { InvestmentAccount } from '../../models';
import {
  Account,
  Commodity,
  Transaction,
  Split,
  Price,
} from '../../entities';
import { PriceDB, PriceDBMap } from '../../prices';
import Money from '../../Money';

describe('InvestmentAccount', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue(new PriceDBMap([]));
    jest.spyOn(PriceDB, 'getHistory').mockResolvedValue(new PriceDBMap([]));
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe.each(
    ['STOCK', 'MUTUAL'],
  )('instance %s', (type) => {
    let commodityEur: Commodity;
    let commodityAccount: Commodity;

    beforeEach(async () => {
      commodityEur = await Commodity.create({
        guid: 'eur_guid',
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      commodityAccount = await Commodity.create({
        guid: 'commodity_guid',
        namespace: 'NASDAQ',
        mnemonic: 'TICKER',
      }).save();

      const investmentAccount = await Account.create({
        guid: 'investments_guid',
        name: 'Investments',
        type: 'ASSET',
        fk_commodity: 'eur_guid',
      }).save();

      await Account.create({
        guid: 'investment_guid',
        name: type,
        type,
        fk_commodity: 'commodity_guid',
        parent: investmentAccount,
      }).save();
    });

    it('initializes all values as expected', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          guid: 'price1_guid',
          fk_commodity: commodityAccount,
          fk_currency: commodityEur,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, 'EUR', priceMap);

      expect(investment.account).toEqual(account);
      expect(investment.account.splits).toEqual([]);

      expect(investment.mainCurrency).toEqual('EUR');
      expect(investment.currency).toEqual('EUR');

      expect(investment.quantity.toString()).toEqual('0.00 TICKER');
      expect(investment.cost.toString()).toEqual('0.00 EUR');
      expect(investment.costInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.value.toString()).toEqual('0.00 EUR');
      expect(investment.valueInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.avgPrice).toEqual(0);

      expect(investment.realizedProfit.toString()).toEqual('0.00 EUR');
      expect(investment.realizedProfitInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.realizedDividends.toString()).toEqual('0.00 EUR');
      expect(investment.realizedDividendsInCurrency.toString()).toEqual('0.00 EUR');

      expect(investment.dividends).toHaveLength(0);

      expect(investment.quoteInfo).toEqual({
        changeAbs: -1,
        changePct: -1,
        currency: 'EUR',
        price: 2000,
      });
    });

    it('initializes all values as expected with difference currency in Price', async () => {
      const commodityUsd = await Commodity.create({
        guid: 'usd_guid',
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      const priceMap = new PriceDBMap([
        Price.create({
          guid: 'price1_guid',
          fk_commodity: commodityAccount,
          fk_currency: commodityUsd,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, 'EUR', priceMap);

      expect(investment.account).toEqual(account);
      expect(investment.account.splits).toEqual([]);

      expect(investment.mainCurrency).toEqual('EUR');
      expect(investment.currency).toEqual('USD');

      expect(investment.quantity.toString()).toEqual('0.00 TICKER');
      expect(investment.cost.toString()).toEqual('0.00 USD');
      expect(investment.costInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.value.toString()).toEqual('0.00 USD');
      expect(investment.valueInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.avgPrice).toEqual(0);

      expect(investment.realizedProfit.toString()).toEqual('0.00 USD');
      expect(investment.realizedProfitInCurrency.toString()).toEqual('0.00 EUR');
      expect(investment.realizedDividends.toString()).toEqual('0.00 USD');
      expect(investment.realizedDividendsInCurrency.toString()).toEqual('0.00 EUR');

      expect(investment.dividends).toHaveLength(0);

      expect(investment.quoteInfo).toEqual({
        changeAbs: -1,
        changePct: -1,
        currency: 'USD',
        price: 2000,
      });
    });

    it('can update quoteInfo', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          guid: 'price1_guid',
          fk_commodity: commodityAccount,
          fk_currency: commodityEur,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, 'EUR', priceMap);

      investment.setTodayQuoteInfo({
        price: 1000,
        changePct: -50,
        changeAbs: -1000,
        currency: 'EUR',
      });

      expect(investment.quoteInfo).toEqual({
        price: 1000,
        changePct: -50,
        changeAbs: -1000,
        currency: 'EUR',
      });
    });

    it('fails if no price for today in pricemap', async () => {
      const account = await Account.findOneOrFail({
        where: { type },
        relations: {
          splits: true,
        },
      });
      expect(
        () => new InvestmentAccount(account, 'EUR', new PriceDBMap([])),
      ).toThrow(`Price TICKER.${DateTime.now().toISODate()} not found`);
    });

    it('fails if no quoteInfo in Price', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          guid: 'price1_guid',
          fk_commodity: commodityAccount,
          fk_currency: commodityEur,
          date: DateTime.now(),
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);
      const account = await Account.findOneOrFail({
        where: { type },
        relations: {
          splits: true,
        },
      });
      expect(
        () => new InvestmentAccount(account, 'EUR', priceMap),
      ).toThrow('No quote info found in price \'price1_guid\'');
    });
  });

  describe.each([
    ['EUR', 'EUR', 1, 1],
    ['USD', 'EUR', 0.9856, 0.9756],
  ])('processSplits stockCurrency: %s mainCurrency: %s', (currency, mainCurrency, txExchangeRate, todayExchangeRate) => {
    let rootAccount: Account;
    let stockPrice: Price;
    let mainCommodity: Commodity;
    let stockCommodity: Commodity;
    let stockCurrency: Commodity;
    let currencyPrice: Price;
    let todayCurrencyPrice: Price;

    beforeEach(async () => {
      mainCommodity = await Commodity.create({
        guid: 'main_commodity',
        namespace: 'CURRENCY',
        mnemonic: mainCurrency,
      }).save();

      stockCommodity = await Commodity.create({
        guid: 'stock_commodity',
        namespace: 'NASDAQ',
        mnemonic: 'STOCK',
      }).save();

      stockCurrency = await Commodity.create({
        guid: 'stock_currency',
        namespace: 'CURRENCY',
        mnemonic: currency,
      }).save();

      rootAccount = await Account.create({
        guid: 'root_guid',
        name: 'Root',
        type: 'ROOT',
      }).save();

      await Account.create({
        guid: 'stock_guid',
        name: 'stock',
        type: 'STOCK',
        fk_commodity: 'stock_commodity',
        parent: rootAccount,
      }).save();

      await Account.create({
        guid: 'bank_guid',
        name: 'Broker account',
        type: 'BANK',
        fk_commodity: 'stock_currency',
        parent: rootAccount,
      }).save();

      await Transaction.create({
        guid: 'tx_guid_1',
        fk_currency: 'stock_currency',
        date: DateTime.fromISO('2023-01-01'),
      }).save();

      // Purchase 122.85 stocks for 1000EUR
      await Split.create({
        guid: 'split_guid_1',
        valueNum: 1000,
        valueDenom: 1,
        quantityNum: 1228501,
        quantityDenom: 10000,
        fk_transaction: 'tx_guid_1',
        fk_account: 'stock_guid',
      }).save();

      await Split.create({
        guid: 'split_guid_2',
        valueNum: -1000,
        valueDenom: 1,
        quantityNum: -1000,
        quantityDenom: 1,
        fk_transaction: 'tx_guid_1',
        fk_account: 'bank_guid',
      }).save();

      currencyPrice = await Price.create({
        guid: 'price_currency',
        fk_commodity: stockCurrency,
        fk_currency: mainCommodity,
        date: DateTime.fromISO('2023-01-01'),
        source: `maffin::{"price":${txExchangeRate},"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
        valueNum: txExchangeRate * 10000,
        valueDenom: 10000,
      }).save();

      todayCurrencyPrice = await Price.create({
        guid: 'price_currency_today',
        fk_commodity: stockCurrency,
        fk_currency: mainCommodity,
        date: DateTime.now(),
        source: `maffin::{"price":${todayExchangeRate},"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
        valueNum: todayExchangeRate * 10000,
        valueDenom: 10000,
      }).save();

      stockPrice = await Price.create({
        guid: 'price_stock',
        fk_commodity: stockCommodity,
        fk_currency: stockCurrency,
        date: DateTime.now(),
        source: `maffin::{"price":10,"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
        valueNum: 10,
        valueDenom: 1,
      }).save();
    });

    describe('buy', () => {
      it('processes buy transaction as expected', async () => {
        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('122.85 STOCK');
        expect(instance.cost.toString()).toEqual(`1000.00 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`${instance.cost.convert(mainCurrency, currencyPrice.value)}`);
        expect(instance.avgPrice).toEqual(8.14);

        expect(instance.value.toString()).toEqual(`1228.50 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`${instance.value.convert(mainCurrency, todayCurrencyPrice.value)}`);
      });

      it('accumulates multiple buys', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-10'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: 1700,
          valueDenom: 1,
          quantityNum: 2457002,
          quantityDenom: 10000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: -1700,
          valueDenom: 1,
          quantityNum: -1700,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const currencyPrice2 = await Price.create({
          guid: 'price_currency_2',
          fk_commodity: stockCurrency,
          fk_currency: mainCommodity,
          date: DateTime.fromISO('2023-01-10'),
          source: `maffin::{"price":0.9056,"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
          valueNum: currency === mainCurrency ? 10000 : 9056,
          valueDenom: 10000,
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, currencyPrice2, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('368.55 STOCK');
        expect(instance.cost.toString()).toEqual(`2700.00 ${currency}`);
        const expectedCostInCurrency = new Money(
          1000 * currencyPrice.value + 1700 * currencyPrice2.value,
          mainCurrency,
        );
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.value.toString()).toEqual(`3685.50 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(
          `${instance.value.convert(mainCurrency, todayCurrencyPrice.value)}`,
        );
        expect(instance.avgPrice).toEqual(7.326);
      });
    });

    describe('sell', () => {
      it('deducts quantity to 0', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: -1000,
          valueDenom: 1,
          quantityNum: -1228501,
          quantityDenom: 10000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 1000,
          valueDenom: 1,
          quantityNum: 1000,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0.00 STOCK');
        expect(instance.realizedProfit.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
        expect(instance.cost.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
      });

      it('sells with gains', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: -2000,
          valueDenom: 1,
          quantityNum: -1228501,
          quantityDenom: 10000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 2000,
          valueDenom: 1,
          quantityNum: 2000,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0.00 STOCK');
        expect(instance.realizedProfit.toString()).toEqual(`1000.00 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          1000 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
      });

      it('sells with losses', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: -500,
          valueDenom: 1,
          quantityNum: -1228501,
          quantityDenom: 10000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 500,
          valueDenom: 1,
          quantityNum: 500,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0.00 STOCK');
        expect(instance.realizedProfit.toString()).toEqual(`-500.00 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          -500 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
      });

      it('sells partially with gains', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: -1000,
          valueDenom: 1,
          quantityNum: -6142505,
          quantityDenom: 100000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 1000,
          valueDenom: 1,
          quantityNum: 1000,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('61.42 STOCK');
        expect(instance.realizedProfit.toString()).toEqual(`500.00 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(500 * currencyPrice.value, mainCurrency);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`500.00 ${currency}`);
        const expectedCostInCurrency = new Money(500 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.value.toString()).toEqual(`614.25 ${currency}`);
        const expectedValueInCurrency = new Money(614.25 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });

      it('sells partially with losses', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: -250,
          valueDenom: 1,
          quantityNum: -6142505,
          quantityDenom: 100000,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 250,
          valueDenom: 1,
          quantityNum: 250,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('61.42 STOCK');
        expect(instance.realizedProfit.toString()).toEqual(`-250.00 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          -250 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`500.00 ${currency}`);
        const expectedCostInCurrency = new Money(500 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.value.toString()).toEqual(`614.25 ${currency}`);
        const expectedValueInCurrency = new Money(614.25 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });
    });

    describe('split', () => {
      it('increases amount of stocks', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 21,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('143.85 STOCK');
        expect(instance.cost.toString()).toEqual(`1000.00 ${currency}`); // cost stays the same
        const expectedCostInCurrency = new Money(1000 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.avgPrice).toEqual(6.9517); // avgPrice is recomputed
        expect(instance.value.toString()).toEqual(`1438.50 ${currency}`); // value increases
        const expectedValueInCurrency = new Money(1438.50 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });
    });

    describe('scrip', () => {
      it('increases amount of stocks', async () => {
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Split.create({
          guid: 'split_guid_3',
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 21,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 21,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('143.85 STOCK');
        expect(instance.cost.toString()).toEqual(`1000.00 ${currency}`); // cost stays the same
        const expectedCostInCurrency = new Money(1000 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.avgPrice).toEqual(6.9517); // avgPrice is recomputed
        expect(instance.value.toString()).toEqual(`1438.50 ${currency}`); // value increases
        const expectedValueInCurrency = new Money(1438.50 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });
    });

    describe('dividend', () => {
      beforeEach(async () => {
        await Account.create({
          guid: 'income_guid',
          name: 'Income',
          type: 'INCOME',
          fk_commodity: 'main_commodity',
          parent: rootAccount,
        }).save();

        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'stock_currency',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        // This split is used to associate the STOCK it comes from
        await Split.create({
          guid: 'split_guid_3',
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 0,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_4',
          valueNum: 89.67,
          valueDenom: 1,
          quantityNum: 89.67,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'bank_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_5',
          valueNum: -89.67,
          valueDenom: 1,
          quantityNum: -89.67,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_2',
          fk_account: 'income_guid',
        }).save();
      });

      it('increases dividend amount', async () => {
        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.realizedProfit.toString()).toEqual(`0.00 ${currency}`);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(`0.00 ${mainCurrency}`);
        expect(instance.realizedDividends.toString()).toEqual(`89.67 ${currency}`);
        const expected = new Money(89.67 * currencyPrice.value, mainCurrency);
        expect(instance.realizedDividendsInCurrency.toString()).toEqual(expected.toString());

        expect(instance.dividends[0].amount.toString()).toEqual(`89.67 ${currency}`);
        expect(instance.dividends[0].amountInCurrency.toString()).toEqual(expected.toString());
        expect(instance.dividends[0].when.toISODate()).toEqual('2023-01-02');
      });

      /**
       * I haven't seen a use case where dividends are earned in different currencies
       * and it would complicate things if we did so this is expected
       */
      it('throws an error if dividends with different currency', async () => {
        await Commodity.create({
          guid: 'sgd_commodity',
          namespace: 'CURRENCY',
          mnemonic: 'SGD',
        }).save();

        await Transaction.create({
          guid: 'tx_guid_3',
          fk_currency: 'sgd_commodity',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        // This split is used to associate the STOCK it comes from
        await Split.create({
          guid: 'split_guid_6',
          valueNum: 0,
          valueDenom: 1,
          quantityNum: 0,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_3',
          fk_account: 'stock_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_7',
          valueNum: 89.67,
          valueDenom: 1,
          quantityNum: 89.67,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_3',
          fk_account: 'bank_guid',
        }).save();

        await Split.create({
          guid: 'split_guid_8',
          valueNum: -89.67,
          valueDenom: 1,
          quantityNum: -89.67,
          quantityDenom: 1,
          fk_transaction: 'tx_guid_3',
          fk_account: 'income_guid',
        }).save();

        await Price.create({
          guid: 'sgd_price',
          fk_commodity: 'sgd_commodity',
          fk_currency: 'main_commodity',
          date: DateTime.fromISO('2023-01-02'),
          valueNum: 9086,
          valueDenom: 10000,
        }).save();

        const dividendCurrencyPrice = await Price.findOneByOrFail({ guid: 'sgd_price' });
        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, dividendCurrencyPrice]),
        );

        expect(() => instance.realizedDividends).toThrow();
      });

      /**
       * There's case though for specific stocks trading in X currency
       * giving dividends in another currency. Check VHYL which trades in
       * EUR but dividends are issued in USD.
       */
      it('supports dividends in different currency than account\'s currency', async () => {
        await Commodity.create({
          guid: 'sgd_commodity',
          namespace: 'CURRENCY',
          mnemonic: 'SGD',
        }).save();

        // Override the already existing one with USD
        await Transaction.create({
          guid: 'tx_guid_2',
          fk_currency: 'sgd_commodity',
          date: DateTime.fromISO('2023-01-02'),
        }).save();

        await Price.create({
          guid: 'sgd_price',
          fk_commodity: 'sgd_commodity',
          fk_currency: 'main_commodity',
          date: DateTime.fromISO('2023-01-02'),
          valueNum: 7086,
          valueDenom: 10000,
        }).save();

        const dividendCurrencyPrice = await Price.findOneByOrFail({ guid: 'sgd_price' });
        const account = await Account.findOneOrFail({
          where: { type: 'STOCK' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          'EUR',
          new PriceDBMap([stockPrice, currencyPrice, dividendCurrencyPrice]),
        );

        expect(instance.realizedDividends.toString()).toEqual('89.67 SGD');
        const expected = new Money(89.67 * dividendCurrencyPrice.value, mainCurrency);
        expect(instance.realizedDividendsInCurrency.toString()).toEqual(expected.toString());

        expect(instance.dividends[0].amount.toString()).toEqual('89.67 SGD');
        expect(instance.dividends[0].amountInCurrency.toString()).toEqual(expected.toString());
      });
    });

    it('throws error on unknown split combination', async () => {
      await Transaction.create({
        guid: 'tx_guid_2',
        fk_currency: 'stock_currency',
        date: DateTime.fromISO('2023-01-02'),
      }).save();

      // This split is used to associate the STOCK it comes from
      await Split.create({
        guid: 'split_guid_3',
        valueNum: 0,
        valueDenom: 1,
        quantityNum: 0,
        quantityDenom: 1,
        fk_transaction: 'tx_guid_2',
        fk_account: 'stock_guid',
      }).save();

      await Split.create({
        guid: 'split_guid_4',
        valueNum: 89.67,
        valueDenom: 1,
        quantityNum: 89.67,
        quantityDenom: 1,
        fk_transaction: 'tx_guid_2',
        fk_account: 'bank_guid',
      }).save();

      const account = await Account.findOneOrFail({
        where: { type: 'STOCK' },
        relations: {
          splits: {
            fk_transaction: {
              splits: true,
            },
          },
        },
      });
      expect(
        () => new InvestmentAccount(
          account,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        ),
      ).toThrow('Dont know how to process stock transaction \'tx_guid_2\'');
    });
  });
});
