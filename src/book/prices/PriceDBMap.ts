import { DateTime } from 'luxon';

import { Price } from '../entities';

export default class PriceDBMap {
  readonly prices: Price[];
  readonly map: { [key: string]: Price[] } = {};

  constructor(instances: Price[] = []) {
    this.prices = instances;
    instances.forEach(instance => {
      let key = `${instance.commodity.mnemonic}.${instance.currency.mnemonic}`;
      // In case of non currency commodities, the currency is unknown
      // and we use Price object to get it
      if (instance.commodity.namespace !== 'CURRENCY') {
        key = instance.commodity.mnemonic;
      }

      if (key in this.map) {
        this.map[key].push(instance);
      } else {
        this.map[key] = [instance];
      }
    });
  }

  getPrice(from: string, to: string, when?: DateTime): Price {
    const missingPrice = Price.create({
      guid: 'missing_price',
      date: DateTime.now(),
      valueNum: 1,
      valueDenom: 1,
      fk_commodity: {
        mnemonic: from,
      },
      fk_currency: {
        mnemonic: to,
      },
    });

    if (from === to) {
      return missingPrice;
    }

    const key = `${from}.${to}`;
    return this._getPrice(key, missingPrice, when);
  }

  getInvestmentPrice(from: string, when?: DateTime): Price {
    const missingPrice = Price.create({
      guid: 'missing_price',
      date: DateTime.now(),
      valueNum: 1,
      valueDenom: 1,
      fk_commodity: {
        mnemonic: from,
      },
    });

    const key = from;
    return this._getPrice(key, missingPrice, when);
  }

  // Retrieves the price for the given key for a given date. Any price before or on
  // the same date is valid, prioritizing the current date. If no price is found then
  // we return a price rate of 1
  _getPrice(key: string, missingPrice: Price, when?: DateTime): Price {
    const prices = this.map[key];

    if (!prices) {
      console.log(`Missing price for ${key}`);
      return missingPrice;
    }

    if (!when) {
      return prices[prices.length - 1];
    }

    const possible = prices.filter(price => price.date <= when);
    const chosenPrice = possible[possible.length - 1];
    if (!chosenPrice) {
      return prices[0];
    }

    return chosenPrice;
  }

  get keys(): string[] {
    return Object.keys(this.map);
  }

  get isEmpty(): boolean {
    return this.prices.length === 0;
  }
}
