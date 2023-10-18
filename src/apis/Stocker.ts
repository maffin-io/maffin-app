import { Amplify, API } from 'aws-amplify';
import { DateTime } from 'luxon';

import awsExports from '../aws-exports';

Amplify.configure(awsExports);

export default class Stocker {
  apiName: string;

  constructor() {
    this.apiName = 'stocker';
  }

  async search(ticker: string): any {
    const options = {
      queryStringParameters: {
        id: ticker,
      },
    };

    const resp = await API.get(this.apiName, '/api/search', options);

    return resp;
  }

  async getLiveSummary(tickers: string[]): Promise<{ [key: string]:LiveSummary; }> {
    const options = {
      queryStringParameters: {
        ids: [tickers].toString(),
      },
    };
    const resp = await API.get(this.apiName, '/api/prices/live', options);

    return resp;
  }

  async getPrice(ticker: string, when: DateTime): Promise<{ price: number, currency: string }> {
    const options = {
      queryStringParameters: {
        id: ticker,
        when: Math.floor(when.toSeconds()),
      },
    };
    const resp = await API.get(this.apiName, '/api/price', options);

    return {
      price: Number(resp.price.toFixed(4)),
      currency: resp.currency,
    };
  }
}

export type LiveSummary = {
  price: number,
  changePct: number,
  changeAbs: number,
  currency: string,
};
