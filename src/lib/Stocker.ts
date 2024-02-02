import { Amplify, API } from 'aws-amplify';
import { DateTime } from 'luxon';

import { Commodity, Price } from '@/book/entities';
import { getMainCurrency } from '@/lib/queries';
import { toAmountWithScale } from '@/helpers/number';
import type { Credentials } from '@/types/user';

import awsExports from '../aws-exports';

Amplify.configure(awsExports);

const API_NAME = 'stocker';

export async function authorize(code: string): Promise<Credentials> {
  const start = performance.now();
  const options = {
    queryStringParameters: {
      code,
    },
  };

  const resp = await API.get(API_NAME, '/user/authorize', options) as Credentials;
  const end = performance.now();
  console.log(`/user/authorize: ${end - start}ms`);

  return resp;
}

export async function refresh(refreshToken: string): Promise<Credentials> {
  const start = performance.now();
  const options = {
    queryStringParameters: {
      refresh_token: refreshToken,
    },
  };

  const resp = await API.get(API_NAME, '/user/refresh', options) as Credentials;
  const end = performance.now();
  console.log(`/user/refresh: ${end - start}ms`);

  return resp;
}

/**
 * Connect to Stocker API and retrieve current prices for
 * all currency pairs and commodities.
 */
export async function insertTodayPrices(): Promise<void> {
  const start = performance.now();
  const mainCurrency = await getMainCurrency();
  const [currencies, commodities] = await Promise.all([
    Commodity.findBy({ namespace: 'CURRENCY' }),
    Commodity.find({
      where: [
        { namespace: 'STOCK' },
        { namespace: 'MUTUAL' },
      ],
    }),
  ]);

  const currencyTickers = currencies
    .filter(c => c.guid !== mainCurrency.guid)
    .map(c => `${c.mnemonic}${mainCurrency.mnemonic}=X`);

  const commodityTickers = commodities.map(c => c.cusip || c.mnemonic);
  const tickers = [
    ...currencyTickers,
    ...commodityTickers,
  ];

  const options = {
    queryStringParameters: {
      ids: Array.from(new Set(tickers)).toString(),
    },
  };
  const resp = await API.get(API_NAME, '/api/prices', options) as { [key: string]:LiveSummary; };

  const now = DateTime.now().startOf('day');

  const prices = Object.entries(resp).map(([key, summary]) => {
    let commodityMnemonic = key.substring(0, 3);
    let currencyMnemonic = key.substring(3, 6);
    if (!key.endsWith('=X')) {
      commodityMnemonic = key;
      currencyMnemonic = summary.currency;
    }
    const { amount, scale } = toAmountWithScale(summary.price);

    const commodity: Commodity = (
      currencies.find(c => c.mnemonic === commodityMnemonic)
      || commodities.find(
        c => (c.mnemonic === commodityMnemonic || c.cusip === commodityMnemonic),
      )
    ) as Commodity;

    const currency: Commodity = currencies.find(c => c.mnemonic === currencyMnemonic) as Commodity;

    return Price.create({
      fk_commodity: commodity.guid,
      fk_currency: currency.guid,
      date: now,
      source: `maffin::${JSON.stringify(summary)}`,
      valueNum: amount,
      valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
    });
  });

  await Price.upsert(
    prices,
    {
      conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
    },
  );

  const end = performance.now();
  console.log(`/api/prices: ${end - start}ms`);
}

export type LiveSummary = {
  price: number,
  changePct: number,
  changeAbs: number,
  currency: string,
};
