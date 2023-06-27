const axios= require('axios');

const { HTTPError } = require('./errors');

class YahooError extends HTTPError {}

const HOST = 'https://query2.finance.yahoo.com';

async function getLiveSummary(ticker) {
  let resp;
  if (ticker === 'SGDCAD=X') {
    ticker = 'SGDCAX=X';
  }
  try {
    resp = await axios.get(
      `${HOST}/v10/finance/quoteSummary/${ticker}?modules=price`,
    );
  } catch (error) {
    throw new YahooError(
      `${ticker} failed: error.message`,
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
  YahooError,
};
