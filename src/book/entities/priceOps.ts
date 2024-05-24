import type { DateTime } from 'luxon';
import type { PriceDBMap } from '../prices';
import type Commodity from './Commodity';
import Price from './Price';

type GetExchangeRateOptions = {
  date: DateTime;
  from: Commodity;
  to: Commodity;
};

const getExchangeRate = (prices: PriceDBMap, options: GetExchangeRateOptions): Price => {
  const { from, to, date } = options;

  const isSameCommodity = from.guid === to.guid;
  if (isSameCommodity) {
    return Price.create({ valueNum: 1, valueDenom: 1 });
  }

  if (to.namespace !== 'CURRENCY') {
    return Price.create({ valueNum: 1, valueDenom: 1 });
  }

  return from.namespace !== 'CURRENCY'
    ? prices.getInvestmentPrice(from.mnemonic, date)
    : prices.getPrice(from.mnemonic, to.mnemonic, date);
};

export const priceOps = {
  getExchangeRate,
};
