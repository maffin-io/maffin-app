import { DateTime } from 'luxon';

import { toFixed } from '@/helpers/number';
import { Account, Split } from '../entities';
import Money from '../Money';
import { PriceDBMap } from '../prices';
import type { QuoteInfo } from '../types';

export default class InvestmentAccount {
  static CACHE_KEY = ['api', 'investments'];

  readonly account: Account;
  readonly splits: Split[];
  quantity: Money;
  totalBought: Money;
  realizedProfit: Money;
  realizedProfitInCurrency: Money;
  readonly dividends: {
    when: DateTime,
    amount: Money,
    amountInCurrency: Money,
  }[] = [];
  readonly currency: string;
  readonly mainCurrency: string;
  private _quoteInfo: QuoteInfo | null = null;
  private _avgPrice = 0;
  private _avgPriceInCurrency = 0;
  private _priceDBMap: PriceDBMap;

  constructor(
    account: Account,
    splits: Split[],
    mainCurrency: string,
    priceDBMap: PriceDBMap,
  ) {
    this.account = account;
    this.splits = splits;
    this.mainCurrency = mainCurrency;

    this._priceDBMap = priceDBMap;
    const price = this._priceDBMap.getInvestmentPrice(
      this.account.commodity.mnemonic,
      DateTime.now(),
    );
    if (price.guid === 'missing_price') {
      throw new Error(`No price found for ${this.account.commodity.mnemonic}`);
    }
    this.currency = price.currency.mnemonic;
    this.setTodayQuoteInfo(
      price.quoteInfo || {
        changePct: 0,
        changeAbs: 0,
        price: price.value,
        currency: this.currency,
      },
    );

    this.processSplits();
  }

  async setTodayQuoteInfo(info: QuoteInfo) {
    this._quoteInfo = info;
  }

  get quoteInfo(): QuoteInfo {
    if (!this._quoteInfo) {
      throw new Error('Need to set quoteInfo first');
    }
    return this._quoteInfo;
  }

  get avgPrice(): number {
    return toFixed(this._avgPrice, 4);
  }

  get cost(): Money {
    return new Money(this._avgPrice, this.currency).multiply(
      this.quantity.toNumber(),
    );
  }

  get costInCurrency(): Money {
    return new Money(
      this._avgPriceInCurrency,
      this.mainCurrency,
    ).multiply(this.quantity.toNumber());
  }

  get value(): Money {
    return this.quantity.convert(
      this.currency,
      this.quoteInfo.price,
    );
  }

  get valueInCurrency(): Money {
    if (this.value.isZero()) {
      return new Money(0, this.mainCurrency);
    }
    const mainCurrencyPrice = this._priceDBMap.getPrice(
      this.currency,
      this.mainCurrency,
      DateTime.now(),
    );
    return this.value.convert(
      this.mainCurrency,
      mainCurrencyPrice.value,
    );
  }

  get unrealizedProfitAbs(): Money {
    return this.value.subtract(this.cost);
  }

  get unrealizedProfitAbsInCurrency(): Money {
    return this.valueInCurrency.subtract(this.costInCurrency);
  }

  get unrealizedProfitPct(): number {
    const n = Math.round(
      (((this.unrealizedProfitAbs.toNumber() / this.cost.toNumber()) * 100) + Number.EPSILON) * 100,
    ) / 100;
    return n;
  }

  get unrealizedProfitPctInCurrency(): number {
    const n = Math.round(
      ((
        (this.unrealizedProfitAbsInCurrency.toNumber() / this.costInCurrency.toNumber()) * 100
      ) + Number.EPSILON) * 100,
    ) / 100;
    return n;
  }

  get realizedProfitPct(): number {
    const n = Math.round(
      (
        ((this.realizedProfit.toNumber() / this.totalBought.toNumber()) * 100) + Number.EPSILON
      ) * 100,
    ) / 100;
    return n;
  }

  get realizedDividends(): Money {
    let dividendsCurrency = this.currency;
    if (this.dividends.length) {
      dividendsCurrency = this.dividends[0].amount.currency;
    }

    return this.dividends.reduce(
      (total, dividend) => total.add(dividend.amount),
      new Money(0, dividendsCurrency),
    );
  }

  get realizedDividendsInCurrency(): Money {
    return this.dividends.reduce(
      (total, dividend) => total.add(dividend.amountInCurrency),
      new Money(0, this.mainCurrency),
    );
  }

  get isClosed(): boolean {
    return this.quantity.toNumber() === 0;
  }

  processSplits(date?: DateTime): void {
    this._avgPrice = 0;
    this._avgPriceInCurrency = 0;
    this.quantity = new Money(0, this.account.commodity.mnemonic);
    this.totalBought = new Money(0, this.currency);
    this.realizedProfit = new Money(0, this.currency);
    this.realizedProfitInCurrency = new Money(0, this.mainCurrency);
    this.dividends.splice(0, this.dividends.length);

    [...this.splits].reverse().filter(
      split => split.transaction.date <= (date || DateTime.now()),
    ).forEach((split) => {
      const numSplits = split.transaction.splits.length;

      if (InvestmentAccount.isBuy(numSplits, split)) {
        this._buy(split);
        return;
      }

      if (InvestmentAccount.isSell(numSplits, split)) {
        this._sell(split);
        return;
      }

      if (InvestmentAccount.isSplit(numSplits, split)) {
        this._split(split);
        return;
      }

      if (numSplits > 1 && split.value === 0 && split.quantity > 0) {
        this._scrip(split);
        return;
      }

      // Dividends happen in the asset + income account but we add a 0
      // valued split to link it with the stock account (in gnucash you have to do this
      // manually)
      if (numSplits > 2 && split.value === 0 && split.quantity === 0) {
        this._dividend(split);
        return;
      }

      throw new Error(`Dont know how to process ${this.account.name} transaction '${split.transaction.guid}'`);
    });
  }

  static isBuy(numSplits: number, split: Split): boolean {
    return numSplits > 1 && split.value > 0 && split.quantity > 0;
  }

  static isSell(numSplits: number, split: Split): boolean {
    return numSplits > 1 && split.value < 0 && split.quantity < 0;
  }

  static isSplit(numSplits: number, split: Split): boolean {
    return numSplits === 1 && split.value === 0 && split.quantity > 0;
  }

  /**
   * Deals with a buy split type for a stock by doing the following:
   *
   * - accumulates the new quantity which counts the number of shares
   * - accumulates the value which counts the raw cost in the transaction
   *   currency
   * - sets average price as the division of value / quantity
   */
  _buy(split: Split): void {
    const cost = new Money(split.value, split.transaction.currency.mnemonic);
    this.totalBought = this.totalBought.add(cost);
    this._avgPrice = (
      this.cost.add(cost).toNumber()
    ) / (
      this.quantity.add(new Money(split.quantity, this.account.commodity.mnemonic)).toNumber()
    );

    const mainCurrencyPrice = this._priceDBMap.getPrice(
      split.transaction.currency.mnemonic,
      this.mainCurrency,
      split.transaction.date,
    );
    this._avgPriceInCurrency = (
      this.costInCurrency.add(
        new Money(
          split.value,
          this.mainCurrency,
        ).multiply(mainCurrencyPrice.value),
      ).toNumber()
    ) / (
      this.quantity.add(new Money(split.quantity, this.account.commodity.mnemonic)).toNumber()
    );

    this.quantity = this.quantity.add(new Money(split.quantity, this.account.commodity.mnemonic));
  }

  /**
   * Deals with a sell split type for a stock by doing the following:
   *
   * - deducts the split quantity from the account quantity (the quantity
   *   from the split comes as negative number).
   * - deducts the value from the account value (the value from the split
   *   comes as negative number).
   * - sets the realized profit by calculating how much we sold. If
   *   realized profit is negative it means we lost money, positive we profit
   */
  _sell(split: Split): void {
    const sellQuantity = new Money(split.quantity, this.account.commodity.mnemonic);
    const sellValue = new Money(split.value, this.currency);

    const originalCost = sellQuantity.multiply(
      this._avgPrice,
    ).convert(this.currency, 1);
    this.realizedProfit = this.realizedProfit.add(sellValue.subtract(originalCost).multiply(-1));

    const mainCurrencyPrice = this._priceDBMap.getPrice(
      this.currency,
      this.mainCurrency,
      split.transaction.date,
    );
    this.realizedProfitInCurrency = this.realizedProfitInCurrency.add(
      sellValue.subtract(originalCost).multiply(-1).convert(
        this.mainCurrency,
        mainCurrencyPrice.value,
      ),
    );

    this.quantity = this.quantity.add(sellQuantity);
  }

  /**
   * Deals with a split split type. It just needs to increase
   * the quantity and update the average price.
   */
  _split(split: Split): void {
    const splitQuantity = new Money(split.quantity, this.account.commodity.mnemonic);

    this._avgPrice = this.cost.toNumber() / (this.quantity.toNumber() + splitQuantity.toNumber());
    this._avgPriceInCurrency = this.costInCurrency.toNumber() / (
      this.quantity.toNumber() + splitQuantity.toNumber()
    );
    this.quantity = this.quantity.add(splitQuantity);
  }

  /**
   * Same as split, we just call it differently for clarity
   */
  _scrip(split: Split): void {
    return this._split(split);
  }

  /**
   * Deals with a dividend split type. This one is tricky as gnucash
   * doesnt support this by default. We rely on the user/maffin adding
   * an empty split that helps to identify the income/asset related
   * transaction.
   *
   * If the income split is in mainCurrency, we will retrieve the amountInCurrency
   * from there. Otherwise, we use whatever priceDBMap.getPrice returns for that
   * date.
   */
  _dividend(split: Split): void {
    const brokerSplit = split.transaction.splits.find(s => s.value > 0);
    if (!brokerSplit) {
      throw new Error(`Dividend transaction ${split.transaction.guid} is missing required splits`);
    }

    const incomeSplit = split.transaction.splits.find(
      s => s.account.type === 'INCOME' && s.account.commodity.mnemonic === this.mainCurrency,
    );

    const amountInCurrency = incomeSplit
      ? incomeSplit.quantity * -1
      : brokerSplit.quantity * this._priceDBMap.getPrice(
        brokerSplit.account.commodity.mnemonic,
        this.mainCurrency,
        split.transaction.date,
      ).value;

    this.dividends.push({
      when: split.transaction.date,
      amount: new Money(brokerSplit.quantity, brokerSplit.account.commodity.mnemonic),
      amountInCurrency: new Money(
        amountInCurrency,
        this.mainCurrency,
      ),
    });
  }
}
