import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import { AxiosError } from 'axios';

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

app.get('/api/search', async (req, res) => {
  const ticker = req.query.id as string;
  const type = req.query.type as 'EQUITY' | 'ETF' | 'MUTUALFUND' | 'CURRENCY';
  if (!ticker) {
    res.status(400).json({
      error: 'ID_REQUIRED',
      description: 'You need to pass \'id\' queryparam to search for a quote',
    });
    return;
  }

  try {
    const result = await yahoo.search(ticker, type);
    res.json(result);
  } catch (error) {
    const e = error as AxiosError;
    if (e.response?.status === 404) {
      res.status(404).json(error);
      return 
    }
    console.log(error);
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to search',
    });
    return;
  }
});

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
    result[ticker] = await yahoo.getPrice(ticker);
  }

  const promises: Promise<void>[] = [];

  try {
    tickers.forEach(ticker => promises.push(callAndSave(ticker)));
    await Promise.all(promises);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to retrieve prices',
    });
    return;
  }

  res.json(result);
});

app.get('/api/price', async (req, res) => {
  let ticker = req.query.id;
  let when = Number(req.query.when) || undefined;

  if (!ticker) {
    res.status(400).json({
      error: 'IDS_REQUIRED',
      description: 'You need to pass \'id\' queryparam to select the quote',
    });
    return;
  }

  try {
    const price = await yahoo.getPrice(ticker as string, when);
    res.json(price);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to retrieve prices',
    });
    return;
  }
});
