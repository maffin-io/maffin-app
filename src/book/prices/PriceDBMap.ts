import { DateTime } from 'luxon';

import { Price } from '../entities';

export default class PriceDBMap {
  readonly map: { [pair: string]: Price } = {};

  constructor(instances: Price[]) {
    instances.forEach(instance => {
      if (!instance.commodity.mnemonic || !instance.currency.mnemonic) {
        throw new Error('To create PriceDBMap currency and commodity need to be loaded');
      }

      let key = `${instance.commodity.mnemonic}.${instance.currency.mnemonic}.${instance.date.toISODate()}`;
      if (instance.commodity.namespace !== 'CURRENCY') {
        // In case of stocks/funds the currency is unknown and we use Price object to get it
        key = `${instance.commodity.mnemonic}.${instance.date.toISODate()}`;
      }
      this.map[key] = instance;
    });
  }

  getPrice(from: string, to: string, when: DateTime): Price {
    if (from === to) {
      return Price.create({
        guid: 'tmp_guid',
        date: DateTime.now(),
        valueNum: 1,
        valueDenom: 1,
      });
    }

    let key = `${from}.${to}.${when.toISODate()}`;
    let price = this.map[key];
    if (price) {
      return price;
    }

    // Gnucash has an issue of timezones where pricedb and transaction entries don't match
    // this is how we fix it.
    key = `${from}.${to}.${when.minus({ day: 1 }).toISODate()}`;
    price = this.map[key];
    if (price) {
      return price;
    }

    // Gnucash has an issue of timezones where pricedb and transaction entries don't match
    // this is how we fix it.
    key = `${from}.${to}.${when.plus({ day: 1 }).toISODate()}`;
    price = this.map[key];
    if (price) {
      return price;
    }

    throw new Error(`Price ${from}.${to}.${when.toISODate()} not found`);
  }

  getStockPrice(from: string, when: DateTime): Price {
    let key = `${from}.${when.toISODate()}`;
    let price = this.map[key];
    if (price) {
      return price;
    }

    // Gnucash has an issue of timezones where pricedb and transaction entries don't match
    // this is how we fix it.
    key = `${from}.${when.minus({ day: 1 }).toISODate()}`;
    price = this.map[key];
    if (price) {
      return price;
    }

    throw new Error(`Price ${from}.${when.toISODate()} not found`);
  }
}
