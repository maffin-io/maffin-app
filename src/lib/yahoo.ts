import axios, { AxiosError, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

export type Price = {
  price: number,
  currency: string,
  changePct: number,
  changeAbs: number,
};

export class HTTPError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.message = message;
    this.status = status;
    this.code = code;
  }
}
export class YahooError extends HTTPError {}

const HOST = 'https://query2.finance.yahoo.com';

export default async function getPrices(
  tickers: string[],
): Promise<{ [ticker: string]: Price }> {
  const result: { [ticker: string]: Price } = {};

  async function callAndSave(ticker: string) {
    try {
      result[ticker] = await getPrice(ticker);
    } catch (e) {
      console.warn(`A price retrieval failed: ${e}`);
    }
  }

  const promises: Promise<void>[] = [];

  try {
    tickers.forEach(ticker => promises.push(callAndSave(ticker)));
    await Promise.all(promises);
  } catch (error) {
    return {};
  }

  console.log(result);
  return result;
}

export async function getPrice(t: string, when?: number): Promise<Price> {
  const { ticker, transform } = formatTicker(t);
  let url = `${HOST}/v8/finance/chart/${ticker}?interval=1d&includePrePost=false`;

  if (when) {
    let date = DateTime.fromSeconds(when, { zone: 'utc' });
    // Yahoo api returns an error when we query price for Sunday
    if (date.weekday === 6) {
      date = date.minus({ days: 1 });
    }
    const end = date.endOf('day');
    const start = end.startOf('day');

    url = `${url}&period1=${Math.floor(start.toSeconds())}&period2=${Math.floor(end.toSeconds())}`;
  }

  let resp: AxiosResponse;
  try {
    resp = await axios.get(url);
  } catch (error: unknown) {
    const e = error as AxiosError;
    throw new YahooError(
      `${ticker} failed: ${e.message}. url: ${url}`,
      e.response?.status || 0,
      'UNKNOWN',
    );
  }

  const { result, error } = resp.data.chart;

  if (error !== null) {
    if (error.code === 'Not Found') {
      throw new YahooError(
        `ticker '${ticker}' not found`,
        404,
        'NOT_FOUND',
      );
    }

    throw new YahooError(
      `unknown error '${error.description}'`,
      resp.status,
      'UNKNOWN',
    );
  }

  const { currency } = result[0].meta;
  const price = transform(toStandardUnit(result[0].meta.regularMarketPrice, currency));
  const previousClose = transform(
    toStandardUnit(result[0].meta.chartPreviousClose, currency),
  ) || price;
  const change = price - previousClose;

  return {
    price,
    currency: toStandardCurrency(currency),
    changePct: parseFloat(((change / previousClose) * 100).toFixed(2)),
    changeAbs: parseFloat(change.toFixed(2)),
  };
}

function formatTicker(ticker: string): { ticker: string, transform: Function } {
  if (ticker === 'SGDCAD=X') {
    return {
      ticker: 'SGDCAX=X',
      transform: (n: number) => n,
    };
  }

  if (
    /[EUR|USD|SGD]=X$/.test(ticker)
    && !(/^[EUR|USD|SGD]/.test(ticker))
  ) {
    return {
      ticker: `${ticker.slice(3, 6)}${ticker.slice(0, 3)}=X`,
      transform: (n: number) => 1 / n,
    };
  }

  return {
    ticker,
    transform: (n: number) => n,
  };
}

function toStandardUnit(n: number, currency: string) {
  if (currency === 'GBp') {
    return n * 0.01;
  }

  return n;
}

function toStandardCurrency(currency: string) {
  if (currency === 'GBp') {
    return 'GBP';
  }

  return currency;
}
