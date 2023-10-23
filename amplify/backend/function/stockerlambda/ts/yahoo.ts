import axios, { AxiosError, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

import { HTTPError } from './errors';
import type { Price } from './types';

export class YahooError extends HTTPError {}

const HOST = 'https://query2.finance.yahoo.com';

export async function getPrice(ticker: string, when?: number): Promise<Price> {
  if (ticker === 'SGDCAD=X') {
    ticker = 'SGDCAX=X';
  }
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

  const currency = toCurrency(result[0].meta.currency);
  const price = toStandardUnit(result[0].meta.regularMarketPrice, currency);
  const previousClose = toStandardUnit(result[0].meta.chartPreviousClose, currency);
  const change = price - previousClose;

  return {
    price: price,
    currency,
    changePct: parseFloat(((change / previousClose) * 100).toFixed(2)),
    changeAbs: parseFloat(change.toFixed(2)),
  };
}

function toStandardUnit(n: number, currency: string) {
  if (currency === 'GBP') {
    return n * 0.01;
  }

  return n;
}

function toCurrency(currency: string) {
  if (currency === 'GBp') {
    return 'GBP';
  }

  return currency;
}
