const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const luxon = require('luxon');

const yahoo = require('./yahoo');

const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())


const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://app.maffin.io',
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      ALLOWED_ORIGINS.indexOf(origin) !== -1
      || origin.match(/https:\/\/.*d199ayutgsrlxn\.amplifyapp\.com/g)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/api/search', async (req, res) => {
  const ticker = req.query.id;
  if (!ticker) {
    res.status(400).json({
      error: 'ID_REQUIRED',
      description: 'You need to pass \'id\' queryparam to search for a quote',
    });
    return;
  }

  try {
    const result = await yahoo.search(ticker);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to retrieve prices',
    });
    return;
  }
});

app.get('/api/prices/live', async (req, res) => {
  let tickers = req.query.ids;
  if (!tickers) {
    res.status(400).json({
      error: 'IDS_REQUIRED',
      description: 'You need to pass \'ids\' queryparam to select specific quotes',
    });
    return;
  }

  tickers = tickers.split(',');

  const result = {};
  const promises = [];

  async function callAndSave(ticker) {
    price = await yahoo.getLiveSummary(ticker);
    result[ticker] = price;
  }

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
  let when = Number(req.query.when) || luxon.DateTime.now().toMillis();

  if (!ticker) {
    res.status(400).json({
      error: 'IDS_REQUIRED',
      description: 'You need to pass \'id\' queryparam to select the quote',
    });
    return;
  }

  try {
    price = await yahoo.getPrice(ticker, when);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'UNKNOWN_ERROR',
      description: 'Failed to retrieve prices',
    });
    return;
  }

  res.json(price);
});

module.exports = app;
