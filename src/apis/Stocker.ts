import { Amplify, API } from 'aws-amplify';
import { DateTime } from 'luxon';

import awsExports from '../aws-exports';

Amplify.configure(awsExports);

const API_NAME = 'stocker';

export async function getPrices(tickers: string[]): Promise<{ [key: string]:LiveSummary; }> {
  const options = {
    queryStringParameters: {
      ids: [tickers].toString(),
    },
  };
  const resp = await API.get(API_NAME, '/api/prices', options);

  return resp;
}

export async function getPrice(
  ticker: string,
  when: DateTime,
): Promise<{ price: number, currency: string }> {
  const options = {
    queryStringParameters: {
      id: ticker,
      when: Math.floor(when.toSeconds()),
    },
  };
  const resp = await API.get(API_NAME, '/api/price', options);

  return {
    price: Number(resp.price.toFixed(4)),
    currency: resp.currency,
  };
}

export type LiveSummary = {
  price: number,
  changePct: number,
  changeAbs: number,
  currency: string,
};
