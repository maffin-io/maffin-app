import { Amplify, API } from 'aws-amplify';

import awsExports from '../aws-exports';

Amplify.configure(awsExports);

export default class Stocker {
  apiName: string;

  constructor() {
    this.apiName = 'stocker';
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
}

export type LiveSummary = {
  price: number,
  changePct: number,
  changeAbs: number,
  currency: string,
};
