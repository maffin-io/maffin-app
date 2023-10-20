const axios = require('axios');
const luxon = require('luxon');

const { HTTPError } = require('./errors');

class YahooError extends HTTPError {}

const HOST = 'https://query1.finance.yahoo.com';

async function search(ticker, type) {
  const url = `${HOST}/v1/finance/search?q=${ticker}&newsCount=0&enableFuzzyQuery=false`;
  try {
    resp = await axios.get(url);
  } catch (error) {
    throw new YahooError(
      `${url} failed: ${error.message}`,
      error.response.status,
      'UNKNOWN',
    );
  }

  let typeFilter = ['EQUITY', 'ETF', 'MUTUALFUND', 'CURRENCY'];
  if (type) {
    typeFilter = [type];
  }

  const quotes = resp.data.quotes.filter(
    quote => typeFilter.includes(quote.quoteType),
  );

  if (
    quotes.length === 0
  ) {
    throw new YahooError(
      `No results for ${ticker}`,
      404,
      'NOT_FOUND',
    );
  }

  const info = quotes[0];
  const symbol = info.quoteType === 'CURRENCY' ? info.symbol.substring(0, 3) : info.symbol;

  const result = {
    ticker: symbol,
    namespace: info.quoteType || '',
    name: info.quoteType === 'CURRENCY' ? '' : info.longname,
  };
  return result;
}

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
  let date = luxon.DateTime.fromSeconds(when, { zone: 'utc' });
  // Yahoo api returns an error when we query price for Sunday
  if (date.weekday === 6) {
    date = date.minus({ days: 1 });
  }
  const end = date.endOf('day');
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
  search,
  getLiveSummary,
  getPrice,
  YahooError,
};
