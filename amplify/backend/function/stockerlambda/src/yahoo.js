const axios = require('axios');
const luxon = require('luxon');

const { HTTPError } = require('./errors');

class YahooError extends HTTPError {}

const HOST = 'https://query2.finance.yahoo.com';

async function getLiveSummary(ticker) {
  let resp;
  if (ticker === 'SGDCAD=X') {
    ticker = 'SGDCAX=X';
  }
  const url = `${HOST}/v6/finance/quoteSummary/${ticker}?modules=price`;
  try {
    resp = await axios.get(url);
  } catch (error) {
    throw new YahooError(
      `${url} failed: ${error.message}`,
      error.response.status,
      'UNKNOWN',
    );
  }

  const { quoteSummary } = resp.data;
  if (quoteSummary.error !== null) {
    if (quoteSummary.error.code === 'Not Found') {
      throw new YahooError(
        `ticker '${ticker}' not found`,
        404,
        'NOT_FOUND',
      );
    }

    throw new YahooError(
      `unknown error '${quoteSummary.error.description}'`,
      resp.status,
      'UNKNOWN',
    );
  }

  const priceObj = quoteSummary.result[0].price;
  const { currency } = priceObj;

  return {
    price: priceObj.regularMarketPrice.raw * toStandardUnit(currency),
    currency: toCurrency(currency),
    changePct: priceObj.regularMarketChangePercent.raw * 100,
    changeAbs: priceObj.regularMarketChange.raw * toStandardUnit(currency),
  };
}

async function getPrice(ticker, when) {
  const end = luxon.DateTime.fromSeconds(when, {zone: 'utc'}).endOf('day');
  const start = end.startOf('day');

  if (ticker === 'SGDCAD=X') {
    ticker = 'SGDCAX=X';
  }

  try {
    resp = await axios.get(
      `${HOST}/v8/finance/chart/${ticker}?period1=${Math.floor(start.toSeconds())}&period2=${Math.floor(end.toSeconds())}&interval=1d`,
    );
  } catch (error) {
    throw new YahooError(
      `${ticker} failed: ${error.message}`,
      error.response.status,
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

  if (!result[0].indicators.quote[0].close) {
    throw new YahooError(
      `no historical data for '${ticker}' found`,
      404,
      'NOT_FOUND',
    );
  }

  return {
    price: result[0].indicators.quote[0].close[0],
    currency: toCurrency(result[0].meta.currency),
  };
}

function toStandardUnit(currency) {
  if (currency === 'GBp') {
    return 0.01;
  }

  return 1;
}

function toCurrency(currency) {
  if (currency === 'GBp') {
    return 'GBP';
  }

  return currency;
}

module.exports = {
  getLiveSummary,
  getPrice,
  YahooError,
};
