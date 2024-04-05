import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';

import * as yahoo  from './yahoo';
import { Price } from './types';

export const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

app.use(cors({
  origin: (origin, callback) => {
    if (process.env.ENV === 'dev') {
      callback(null, true);
    } else if (
      process.env.ENV === 'staging'
      && origin === 'https://staging.d1w6jie2l5rnr4.amplifyapp.com'
    ) {
      callback(null, true);
    } else if (
      process.env.ENV === 'master'
      && origin === 'https://app.maffin.io'
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  }
}));

app.get('/api/prices', async (req, res) => {
  let tickers = (req.query.ids as string || '').split(',');
  if (!tickers.length) {
    res.status(400).json({
      error: 'IDS_REQUIRED',
      description: 'You need to pass \'ids\' queryparam to select specific quotes',
    });
    return;
  }

  const result: { [ticker: string]: Price } = {};

  async function callAndSave(ticker: string) {
    try {
      result[ticker] = await yahoo.getPrice(ticker);
    } catch (e) {
      console.warn(`A price retrieval failed: ${e}`);
    }
  }

  const promises: Promise<void>[] = [];

  try {
    tickers.forEach(ticker => promises.push(callAndSave(ticker)));
    await Promise.all(promises);
  } catch (error) {
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to retrieve prices',
    });
    return;
  }

  res.json(result);
});
