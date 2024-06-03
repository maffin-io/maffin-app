import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import { InvestmentAccount } from '@/book/models';
import {
  Account,
  BankConfig,
  Commodity,
  Transaction,
  Split,
  Price,
} from '@/book/entities';
import { PriceDBMap } from '@/book/prices';
import Money from '@/book/Money';

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
}));

describe('InvestmentAccount', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, BankConfig, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('instance', () => {
    let eur: Commodity;
    let commodityAccount: Commodity;

    beforeEach(async () => {
      eur = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      commodityAccount = await Commodity.create({
        namespace: 'NASDAQ',
        mnemonic: 'TICKER',
      }).save();

      const root = await Account.create({
        name: 'Root',
        type: 'ROOT',
      }).save();

      const investmentAccount = await Account.create({
        name: 'Investments',
        type: 'ASSET',
        parent: root,
        fk_commodity: eur,
      }).save();

      await Account.create({
        name: 'investment',
        type: 'INVESTMENT',
        fk_commodity: commodityAccount,
        parent: investmentAccount,
      }).save();
    });

    it('initializes all values as expected', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          fk_commodity: commodityAccount,
          fk_currency: eur,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type: 'INVESTMENT' },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, account.splits, 'EUR', priceMap);

      expect(investment.account).toEqual(account);
      expect(investment.splits).toEqual([]);

      expect(investment.mainCurrency).toEqual('EUR');
      expect(investment.currency).toEqual('EUR');

      expect(investment.quantity.toString()).toEqual('0 TICKER');
      expect(investment.cost.toString()).toEqual('0 EUR');
      expect(investment.costInCurrency.toString()).toEqual('0 EUR');
      expect(investment.value.toString()).toEqual('0 EUR');
      expect(investment.valueInCurrency.toString()).toEqual('0 EUR');
      expect(investment.avgPrice).toEqual(0);

      expect(investment.realizedProfit.toString()).toEqual('0 EUR');
      expect(investment.realizedProfitInCurrency.toString()).toEqual('0 EUR');
      expect(investment.realizedDividends.toString()).toEqual('0 EUR');
      expect(investment.realizedDividendsInCurrency.toString()).toEqual('0 EUR');
      expect(investment.isClosed).toBe(true);

      expect(investment.dividends).toHaveLength(0);

      expect(investment.quoteInfo).toEqual({
        changeAbs: -1,
        changePct: -1,
        currency: 'EUR',
        price: 2000,
        date: DateTime.now(),
      });
    });

    it('initializes all values as expected with difference currency in Price', async () => {
      const usd = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      const priceMap = new PriceDBMap([
        Price.create({
          fk_commodity: commodityAccount,
          fk_currency: usd,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"USD"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type: 'INVESTMENT' },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, account.splits, 'EUR', priceMap);

      expect(investment.account).toEqual(account);
      expect(investment.splits).toEqual([]);

      expect(investment.mainCurrency).toEqual('EUR');
      expect(investment.currency).toEqual('USD');

      expect(investment.quantity.toString()).toEqual('0 TICKER');
      expect(investment.cost.toString()).toEqual('0 USD');
      expect(investment.costInCurrency.toString()).toEqual('0 EUR');
      expect(investment.value.toString()).toEqual('0 USD');
      expect(investment.valueInCurrency.toString()).toEqual('0 EUR');
      expect(investment.avgPrice).toEqual(0);

      expect(investment.realizedProfit.toString()).toEqual('0 USD');
      expect(investment.realizedProfitInCurrency.toString()).toEqual('0 EUR');
      expect(investment.realizedDividends.toString()).toEqual('0 USD');
      expect(investment.realizedDividendsInCurrency.toString()).toEqual('0 EUR');

      expect(investment.dividends).toHaveLength(0);

      expect(investment.quoteInfo).toEqual({
        changeAbs: -1,
        changePct: -1,
        currency: 'USD',
        price: 2000,
        date: DateTime.now(),
      });
    });

    it('can update quoteInfo', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          fk_commodity: commodityAccount,
          fk_currency: eur,
          date: DateTime.now(),
          source: 'maffin::{"price":2000,"changePct":-1,"changeAbs":-1,"currency":"EUR"}',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type: 'INVESTMENT' },
        relations: {
          splits: true,
        },
      });
      const investment = new InvestmentAccount(account, account.splits, 'EUR', priceMap);

      investment.setTodayQuoteInfo({
        price: 1000,
        changePct: -50,
        changeAbs: -1000,
        currency: 'EUR',
        date: DateTime.now(),
      });

      expect(investment.quoteInfo).toEqual({
        price: 1000,
        changePct: -50,
        changeAbs: -1000,
        currency: 'EUR',
        date: DateTime.now(),
      });
    });

    it('sets price for date passed in processSplits', async () => {
      const priceMap = new PriceDBMap([
        Price.create({
          fk_commodity: commodityAccount,
          fk_currency: eur,
          date: DateTime.now().minus({ month: 1 }),
          source: '',
          valueNum: 20,
          valueDenom: 100,
        }),
        Price.create({
          fk_commodity: commodityAccount,
          fk_currency: eur,
          date: DateTime.now(),
          source: '',
          valueNum: 10,
          valueDenom: 100,
        }),
      ]);

      const account = await Account.findOneOrFail({
        where: { type: 'INVESTMENT' },
        relations: {
          splits: true,
        },
      });

      const investment = new InvestmentAccount(account, account.splits, 'EUR', priceMap);

      expect(investment.quoteInfo.price).toEqual(0.1);
      expect(investment.quoteInfo.date).toEqual(DateTime.now());

      investment.processSplits(DateTime.now().minus({ month: 1 }));

      expect(investment.quoteInfo.price).toEqual(0.2);
      expect(investment.quoteInfo.date).toEqual(DateTime.now().minus({ month: 1 }));
    });
  });

  describe.each([
    ['EUR', 'EUR', 1, 1],
    ['USD', 'EUR', 0.9856, 0.9756],
  ])('processSplits stockCurrency: %s mainCurrency: %s', (currency, mainCurrency, txExchangeRate, todayExchangeRate) => {
    let rootAccount: Account;
    let stockAccount: Account;
    let brokerAccount: Account;
    let stockPrice: Price;
    let mainCommodity: Commodity;
    let stockCommodity: Commodity;
    let stockCurrency: Commodity;
    let currencyPrice: Price;
    let todayCurrencyPrice: Price;

    beforeEach(async () => {
      mainCommodity = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: mainCurrency,
      }).save();

      stockCommodity = await Commodity.create({
        namespace: 'STOCK',
        mnemonic: 'TICKER',
      }).save();

      if (currency === mainCurrency) {
        stockCurrency = mainCommodity;
      } else {
        stockCurrency = await Commodity.create({
          namespace: 'CURRENCY',
          mnemonic: currency,
        }).save();
      }

      rootAccount = await Account.create({
        name: 'Root',
        type: 'ROOT',
      }).save();

      const investmentsAccount = await Account.create({
        name: 'Investments',
        type: 'ASSET',
        fk_commodity: stockCurrency,
        parent: rootAccount,
      }).save();

      stockAccount = await Account.create({
        name: 'stock',
        type: 'INVESTMENT',
        fk_commodity: stockCommodity,
        parent: investmentsAccount,
      }).save();

      brokerAccount = await Account.create({
        name: 'Broker',
        type: 'BANK',
        fk_commodity: stockCurrency,
        parent: investmentsAccount,
      }).save();

      await Transaction.create({
        description: 'description',
        fk_currency: stockCurrency,
        date: DateTime.fromISO('2022-01-01'),
        splits: [
          // Purchase 122.85 stocks for 1000EUR
          {
            valueNum: 1000,
            valueDenom: 1,
            quantityNum: 1228501,
            quantityDenom: 10000,
            fk_account: stockAccount,
          },
          {
            valueNum: -1000,
            valueDenom: 1,
            quantityNum: -1000,
            quantityDenom: 1,
            fk_account: brokerAccount,
          },
        ],
      }).save();

      currencyPrice = await Price.create({
        fk_commodity: stockCurrency,
        fk_currency: mainCommodity,
        date: DateTime.fromISO('2022-01-01'),
        source: `maffin::{"price":${txExchangeRate},"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
        valueNum: txExchangeRate * 10000,
        valueDenom: 10000,
      }).save();

      todayCurrencyPrice = await Price.create({
        fk_commodity: stockCurrency,
        fk_currency: mainCommodity,
        date: DateTime.now(),
        source: `maffin::{"price":${todayExchangeRate},"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
        valueNum: todayExchangeRate * 10000,
        valueDenom: 10000,
      }).save();

      stockPrice = await Price.create({
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
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('122.85 TICKER');
        expect(instance.cost.toString()).toEqual(`1000 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`${instance.cost.convert(mainCurrency, currencyPrice.value)}`);
        expect(instance.avgPrice).toEqual(8.14);

        expect(instance.value.toString()).toEqual(`1228.5 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`${instance.value.convert(mainCurrency, todayCurrencyPrice.value)}`);
      });

      it('accumulates multiple buys', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-10'),
          splits: [
            {
              valueNum: 1700,
              valueDenom: 1,
              quantityNum: 2457002,
              quantityDenom: 10000,
              fk_account: stockAccount,
            },
            {
              valueNum: -1700,
              valueDenom: 1,
              quantityNum: -1700,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const currencyPrice2 = await Price.create({
          fk_commodity: stockCurrency,
          fk_currency: mainCommodity,
          date: DateTime.fromISO('2022-01-10'),
          source: `maffin::{"price":0.9056,"changePct":-1,"changeAbs":-1,"currency":"${currency}"}`,
          valueNum: currency === mainCurrency ? 10000 : 9056,
          valueDenom: 10000,
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, currencyPrice2, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('368.55 TICKER');
        expect(instance.cost.toString()).toEqual(`2700 ${currency}`);
        const expectedCostInCurrency = new Money(
          1000 * currencyPrice.value + 1700 * currencyPrice2.value,
          mainCurrency,
        );
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.value.toString()).toEqual(`3685.5 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(
          `${instance.value.convert(mainCurrency, todayCurrencyPrice.value)}`,
        );
        expect(instance.avgPrice).toEqual(7.326);
      });
    });

    describe('sell', () => {
      it('deducts quantity to 0', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: -1000,
              valueDenom: 1,
              quantityNum: -1228501,
              quantityDenom: 10000,
              fk_account: stockAccount,
            },
            {
              valueNum: 1000,
              valueDenom: 1,
              quantityNum: 1000,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0 TICKER');
        expect(instance.realizedProfit.toString()).toEqual(`0 ${currency}`);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
        expect(instance.cost.toString()).toEqual(`0 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
      });

      it('sells with gains', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              guid: 'split_guid_3',
              valueNum: -2000,
              valueDenom: 1,
              quantityNum: -1228501,
              quantityDenom: 10000,
              fk_account: stockAccount,
            },
            {
              valueNum: 2000,
              valueDenom: 1,
              quantityNum: 2000,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0 TICKER');
        expect(instance.realizedProfit.toString()).toEqual(`1000 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          1000 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`0 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
      });

      it('sells with losses', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: -500,
              valueDenom: 1,
              quantityNum: -1228501,
              quantityDenom: 10000,
              fk_account: stockAccount,
            },
            {
              valueNum: 500,
              valueDenom: 1,
              quantityNum: 500,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('0 TICKER');
        expect(instance.realizedProfit.toString()).toEqual(`-500 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          -500 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`0 ${currency}`);
        expect(instance.costInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
        expect(instance.value.toString()).toEqual(`0 ${currency}`);
        expect(instance.valueInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
      });

      it('sells partially with gains', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: -1000,
              valueDenom: 1,
              quantityNum: -6142505,
              quantityDenom: 100000,
              fk_account: stockAccount,
            },
            {
              valueNum: 1000,
              valueDenom: 1,
              quantityNum: 1000,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('61.42 TICKER');
        expect(instance.realizedProfit.toString()).toEqual(`500 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(500 * currencyPrice.value, mainCurrency);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`500 ${currency}`);
        const expectedCostInCurrency = new Money(500 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.value.toString()).toEqual(`614.25 ${currency}`);
        const expectedValueInCurrency = new Money(614.25 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });

      it('sells partially with losses', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: -250,
              valueDenom: 1,
              quantityNum: -6142505,
              quantityDenom: 100000,
              fk_account: stockAccount,
            },
            {
              valueNum: 250,
              valueDenom: 1,
              quantityNum: 250,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('61.42 TICKER');
        expect(instance.realizedProfit.toString()).toEqual(`-250 ${currency}`);
        const expectedRealizedProfitInCurrency = new Money(
          -250 * currencyPrice.value,
          mainCurrency,
        );
        expect(instance.realizedProfitInCurrency.toString()).toEqual(
          expectedRealizedProfitInCurrency.toString(),
        );
        expect(instance.cost.toString()).toEqual(`500 ${currency}`);
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
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 21,
              quantityDenom: 1,
              fk_account: stockAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('143.85 TICKER');
        expect(instance.cost.toString()).toEqual(`1000 ${currency}`); // cost stays the same
        const expectedCostInCurrency = new Money(1000 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.avgPrice).toEqual(6.9517); // avgPrice is recomputed
        expect(instance.value.toString()).toEqual(`1438.5 ${currency}`); // value increases
        const expectedValueInCurrency = new Money(1438.5 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });
    });

    describe('scrip', () => {
      it('increases amount of stocks', async () => {
        await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 21,
              quantityDenom: 1,
              fk_account: stockAccount,
            },
            {
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 21,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: true,
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice, todayCurrencyPrice]),
        );

        expect(instance.quantity.toString()).toEqual('143.85 TICKER');
        expect(instance.cost.toString()).toEqual(`1000 ${currency}`); // cost stays the same
        const expectedCostInCurrency = new Money(1000 * currencyPrice.value, mainCurrency);
        expect(instance.costInCurrency.toString()).toEqual(expectedCostInCurrency.toString());
        expect(instance.avgPrice).toEqual(6.9517); // avgPrice is recomputed
        expect(instance.value.toString()).toEqual(`1438.5 ${currency}`); // value increases
        const expectedValueInCurrency = new Money(1438.5 * todayCurrencyPrice.value, mainCurrency);
        expect(instance.valueInCurrency.toString()).toEqual(expectedValueInCurrency.toString());
      });
    });

    describe('dividend', () => {
      let incomeAccount: Account;
      let tx: Transaction;

      beforeEach(async () => {
        incomeAccount = await Account.create({
          name: 'Income',
          type: 'INCOME',
          fk_commodity: mainCommodity,
          parent: rootAccount,
        }).save();

        tx = await Transaction.create({
          description: 'description',
          fk_currency: stockCurrency,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            // This split is used to associate the STOCK it comes from
            {
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 0,
              quantityDenom: 1,
              fk_account: stockAccount,
            },
            {
              valueNum: 89.67,
              valueDenom: 1,
              quantityNum: 89.67,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
            {
              valueNum: -89.67,
              valueDenom: 1,
              quantityNum: -89.67,
              quantityDenom: 1,
              fk_account: incomeAccount,
            },
          ],
        }).save();
      });

      it('increases dividend amount', async () => {
        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: {
                  fk_account: true,
                },
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });

        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.realizedProfit.toString()).toEqual(`0 ${currency}`);
        expect(instance.realizedProfitInCurrency.toString()).toEqual(`0 ${mainCurrency}`);
        expect(instance.realizedDividends.toString()).toEqual(`89.67 ${currency}`);
        const expected = new Money(89.67, mainCurrency);
        expect(instance.realizedDividendsInCurrency.toString()).toEqual(expected.toString());

        expect(instance.dividends[0].amount.toString()).toEqual(`89.67 ${currency}`);
        expect(instance.dividends[0].amountInCurrency.toString()).toEqual(expected.toString());
        expect(instance.dividends[0].when.toISODate()).toEqual('2022-01-02');
      });

      /**
       * There's case though for specific stocks trading in X currency
       * giving dividends in another currency. Check VHYL which trades in
       * EUR but dividends are issued in USD. Regardless, we store the dividend
       * in the currency of the account
       */
      it('supports dividend in different currency than account\'s currency', async () => {
        const sgd = Commodity.create({
          namespace: 'CURRENCY',
          mnemonic: 'SGD',
        });
        // The dividend is received in SGD although the account's currency is EUR
        brokerAccount.fk_commodity = sgd;
        await brokerAccount.save();

        const eur = await Commodity.findOneByOrFail({
          namespace: 'CURRENCY',
          mnemonic: 'EUR',
        });
        incomeAccount.fk_commodity = eur;
        await incomeAccount.save();

        // Ignore the default transaction for simpler test
        await Split.delete({
          fk_transaction: tx.guid,
        });
        tx.splits = [];
        await tx.save();

        await Transaction.create({
          description: 'description',
          fk_currency: eur,
          date: DateTime.fromISO('2022-01-02'),
          splits: [
            {
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 0,
              quantityDenom: 1,
              fk_account: stockAccount,
            },
            {
              valueNum: 170,
              valueDenom: 1,
              quantityNum: 176.12,
              quantityDenom: 1,
              fk_account: brokerAccount,
            },
            {
              valueNum: -170,
              valueDenom: 1,
              quantityNum: -170,
              quantityDenom: 1,
              fk_account: incomeAccount,
            },
          ],
        }).save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: {
                  fk_account: true,
                },
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.realizedDividends.toString()).toEqual('176.12 SGD');
        expect(instance.realizedDividendsInCurrency.toString()).toEqual('170 EUR');
      });

      it('works when transaction is not in main currency using income split', async () => {
        const sgd = await Commodity.create({
          namespace: 'CURRENCY',
          mnemonic: 'SGD',
        }).save();
        // Override the already existing one with SGD
        tx.fk_currency = sgd;
        await tx.save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: {
                  fk_account: true,
                },
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          'EUR',
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.realizedDividends.toString()).toEqual(`89.67 ${stockCurrency.mnemonic}`);
        expect(instance.realizedDividendsInCurrency.toString()).toEqual('89.67 EUR');
      });

      it('works when transaction is not in main currency using getPrice', async () => {
        const sgd = await Commodity.create({
          namespace: 'CURRENCY',
          mnemonic: 'SGD',
        }).save();
        // Override the already existing one with SGD
        tx.fk_currency = sgd;
        await tx.save();

        incomeAccount.fk_commodity = sgd;
        await incomeAccount.save();

        const account = await Account.findOneOrFail({
          where: { type: 'INVESTMENT' },
          relations: {
            splits: {
              fk_transaction: {
                splits: {
                  fk_account: true,
                },
              },
            },
          },
          order: {
            splits: {
              fk_transaction: {
                date: 'DESC',
                enterDate: 'DESC',
              },
            },
          },
        });
        const instance = new InvestmentAccount(
          account,
          account.splits,
          'EUR',
          new PriceDBMap([stockPrice, currencyPrice]),
        );

        expect(instance.realizedDividends.toString()).toEqual(`89.67 ${stockCurrency.mnemonic}`);
        expect(instance.realizedDividendsInCurrency.toString()).toEqual(
          stockCurrency.mnemonic === 'USD'
            ? '88.38 EUR'
            : '89.67 EUR',
        );
      });
    });

    it('throws error on unknown split combination', async () => {
      await Transaction.create({
        description: 'description',
        fk_currency: stockCommodity,
        date: DateTime.fromISO('2022-01-02'),
        splits: [
          {
            valueNum: 10,
            valueDenom: 1,
            quantityNum: 10,
            quantityDenom: 1,
            fk_account: stockAccount,
          },
        ],
      }).save();

      const account = await Account.findOneOrFail({
        where: { type: 'INVESTMENT' },
        relations: {
          splits: {
            fk_transaction: {
              splits: true,
            },
          },
        },
        order: {
          splits: {
            fk_transaction: {
              date: 'DESC',
              enterDate: 'DESC',
            },
          },
        },
      });
      expect(
        () => new InvestmentAccount(
          account,
          account.splits,
          mainCurrency,
          new PriceDBMap([stockPrice, currencyPrice]),
        ),
      ).toThrow('Dont know how to process stock transaction');
    });
  });
});
