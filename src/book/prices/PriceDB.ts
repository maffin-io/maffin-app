import { DateTime } from 'luxon';
import { Not, In } from 'typeorm';

import { toAmountWithScale } from '@/helpers/number';
import { getPrices, LiveSummary } from '@/apis/Stocker';
import { Price, Commodity } from '../entities';
import PriceDBMap from './PriceDBMap';
import Money from '../Money';

/**
 * Returns Money containg the rate to convert from to to.
 * If date not passed it returns the latest price. If passed,
 * it finds any rate between -1 +1 day
 *
 * If no rate is found it throws an error.
 */
export async function getRate(from: string, to: string, when?: DateTime): Promise<Money> {
  if (from === to) {
    return new Money(1, to);
  }

  let query = Price
    .createQueryBuilder('prices')
    .leftJoinAndSelect('prices.fk_commodity', 'commodity')
    .leftJoinAndSelect('prices.fk_currency', 'currency')
    .where('commodity.mnemonic = :from', { from })
    .andWhere('currency.mnemonic = :to', { to });

  if (when) {
    query = query
      .andWhere('date(prices.date) >= :dateStart', { dateStart: when.minus({ days: 1 }).toISODate() })
      .andWhere('date(prices.date) <= :dateEnd', { dateEnd: when.plus({ days: 1 }).toISODate() });
  }

  const rate = await query
    .orderBy({ date: 'DESC' })
    .getOneOrFail();

  return new Money(rate.value, to);
}

/**
 * Retrieves todays quotes from stocker and returns them plus storing them
 * in Price.
 *
 * The quotes retrieved are:
 *   - All permutations of currency combinations existing in commodities table
 *   - All prices for stock/mutual accounts (with type) in the currency
 */
export async function getTodayQuotes(): Promise<PriceDBMap> {
  const [currencyQuotes, investmentQuotes] = await Promise.all([
    getCurrencyQuotes(),
    getInvestmentQuotes(),
  ]);

  return new PriceDBMap([
    ...currencyQuotes,
    ...investmentQuotes,
  ]);
}

/**
 * Scans Price data to return all the historical data for a given commodity
 * specified as 'from'.
 *
 * @param to - the commodity to convert to
 * @returns - object where key is from.to.date and value is the Price object
 */
export async function getHistory(to: string): Promise<PriceDBMap> {
  const start = performance.now();
  const prices = await Price
    .createQueryBuilder('prices')
    .leftJoinAndSelect('prices.fk_commodity', 'commodity')
    .leftJoinAndSelect('prices.fk_currency', 'currency')
    .where('currency.mnemonic = :to', { to })
    .getMany();

  const end = performance.now();
  console.log(`get currency exchange history: ${end - start}ms`);

  return new PriceDBMap(prices);
}

async function getCurrencyQuotes(): Promise<Price[]> {
  const currencies = await Commodity.findBy({
    namespace: 'CURRENCY',
  });

  const currencyPairs = new Set<string>();
  currencies.forEach(from => {
    currencies.forEach(to => {
      if (from !== to) {
        currencyPairs.add(`${from.mnemonic}${to.mnemonic}=X`);
      }
    });
  });

  const instances: Price[] = [];
  let prices: { [key: string]: LiveSummary } = {};
  if (currencyPairs.size) {
    prices = await getPrices(Array.from(currencyPairs));
  }

  Object.entries(prices).forEach(([currencyPair, priceObj]) => {
    const from = currencyPair.substring(0, 3);
    const to = currencyPair.substring(3, 6);
    const { amount, scale } = toAmountWithScale(priceObj.price);

    instances.push(Price.create({
      fk_commodity: currencies.find(currency => currency.mnemonic === from),
      fk_currency: currencies.find(currency => currency.mnemonic === to),
      date: DateTime.now().startOf('day'),
      source: `maffin::${JSON.stringify(priceObj)}`,
      valueNum: amount,
      valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
    }));
  });

  // store the prices in DB in background
  Price.upsert(
    instances,
    {
      conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
    },
  );
  return instances;
}

async function getInvestmentQuotes(): Promise<Price[]> {
  const commodities = await Commodity.findBy(
    { namespace: Not(In(['CURRENCY', 'CUSTOM'])) },
  );
  const currencies = await Commodity.findBy({
    namespace: 'CURRENCY',
  });

  const tickers = new Set<string>();
  commodities.forEach(commodity => tickers.add(commodity.stockerId));

  let prices: { [key: string]: LiveSummary } = {};
  if (tickers.size) {
    prices = await getPrices(Array.from(tickers));
  }

  const instances = buildPrices(commodities, currencies, prices);

  Price.upsert(
    Object.values(instances),
    {
      conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
    },
  );
  return instances;
}

function buildPrices(
  commodities: Commodity[],
  currencies: Commodity[],
  prices: { [key: string]: LiveSummary },
): Price[] {
  const instances: Price[] = [];
  Object.entries(prices).forEach(([from, priceObj]) => {
    const { amount, scale } = toAmountWithScale(priceObj.price);

    const commodity = commodities.find(c => c.stockerId === from);
    if (!commodity) {
      throw new Error(`Didnt find matching commodity for ${from}`);
    }
    const currency = currencies.find(c => c.mnemonic === priceObj.currency);
    if (!currency) {
      throw new Error(`Didnt find matching currency for ${priceObj.currency}`);
    }
    instances.push(Price.create({
      fk_commodity: commodity,
      fk_currency: currency,
      date: DateTime.now().startOf('day'),
      source: `maffin::${JSON.stringify(priceObj)}`,
      valueNum: amount,
      valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
    }));
  });

  return instances;
}
