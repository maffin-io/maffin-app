const axios = require('axios');

const yh = require('./yahoo');

jest.mock('axios');

describe('getLiveSummary', () => {
  let mockAxiosGet;

  beforeEach(() => {
    mockAxiosGet = jest.spyOn(axios, 'get');
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        quoteSummary: {
          result: [
            {
              price: {
                regularMarketPrice: {
                  raw: 10,
                },
                regularMarketChangePercent: {
                  raw: -0.1,
                },
                regularMarketChange: {
                  raw: -1,
                },
                currency: 'USD',
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls api with ticker', async () => {
    await yh.getLiveSummary('ticker');

    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v6/finance/quoteSummary/ticker?modules=price',
    );
  });

  it('throws error when axios call fails', async () => {
    mockAxiosGet.mockRejectedValue({
      message: 'message',
      url: 'url',
      response: {
        status: 500,
      },
    });

    try {
      await yh.getLiveSummary('ticker');
    } catch (error) {
      expect(error instanceof yh.YahooError).toBe(true);
      expect(error.message).toEqual(
        'https://query2.finance.yahoo.com/v6/finance/quoteSummary/ticker?modules=price failed: message'
      );
      expect(error.status).toEqual(500);
      expect(error.code).toEqual('UNKNOWN');
    }
    expect.assertions(4);
  });

  it('fails when no data for stock', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        quoteSummary: {
          error: {
            code: 'Not Found',
          },
        },
      },
      status: 404,
    }));

    try {
      await yh.getLiveSummary('ticker');
    } catch (error) {
      expect(error instanceof yh.YahooError).toBe(true);
      expect(error.message).toEqual('ticker \'ticker\' not found');
      expect(error.status).toEqual(404);
      expect(error.code).toEqual('NOT_FOUND');
    }
    expect.assertions(4);
  });

  it('fails when unknown error', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        quoteSummary: {
          error: {
            code: 'Unknown',
            description: 'random error',
          },
        },
      },
      status: 200,
    }));
    try {
      await yh.getLiveSummary('ticker');
    } catch (error) {
      expect(error instanceof yh.YahooError).toBe(true);
      expect(error.message).toEqual('unknown error \'random error\'');
      expect(error.status).toEqual(200);
      expect(error.code).toEqual('UNKNOWN');
    }
    expect.assertions(4);
  });

  it('returns price from http request call with correct params', async () => {
    const resp = await yh.getLiveSummary('ticker');

    expect(resp).toEqual({
      price: 10,
      currency: 'USD',
      changePct: -10,
      changeAbs: -1,
    });
  });

  it('returns price *100 from http request call when GBP', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        quoteSummary: {
          result: [
            {
              price: {
                regularMarketPrice: {
                  raw: 10,
                },
                regularMarketChangePercent: {
                  raw: -0.1,
                },
                regularMarketChange: {
                  raw: -1,
                },
                currency: 'GBp',
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
    }));
    const resp = await yh.getLiveSummary('ticker');

    expect(resp).toEqual({
      price: 0.1,
      changePct: -10,
      changeAbs: -0.01,
      currency: 'GBP',
    });
  });

  it('customises ticker for SGDCAD=X', async () => {
    const resp = await yh.getLiveSummary('SGDCAD=X');

    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v6/finance/quoteSummary/SGDCAX=X?modules=price',
    );

    expect(resp).toEqual({
      price: 10,
      currency: 'USD',
      changePct: -10,
      changeAbs: -1,
    });
  });
});

describe('getPrice', () => {
  let mockAxiosGet;

  beforeEach(() => {
    mockAxiosGet = jest.spyOn(axios, 'get').mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'USD',
              },
              indicators: {
                quote: [
                  {
                    close: [
                      1.89,
                    ],
                  },
                ],
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls api with expected params', async () => {
    await yh.getPrice('ticker', 1684139670);

    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v8/finance/chart/ticker?period1=1684108800&period2=1684195199&interval=1d',
    );
  });

  it('fails when axios call fails', async () => {
    mockAxiosGet.mockRejectedValue({
      message: 'message',
      url: 'url',
      response: {
        status: 500,
      },
    });

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'ticker failed: message',
    );
  });

  it('fails when unknown ticker', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: null,
          error: {
            code: 'Not Found',
            description: 'No data found, symbol may be delisted',
          },
        },
      },
      status: 404,
    }));

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'ticker \'ticker\' not found',
    );
  });

  it('fails when unknown error', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: null,
          error: {
            code: 'Unknown error',
            description: 'error message',
          },
        },
      },
      status: 404,
    }));

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'error message',
    );
  });

  it('queries for previous day when on Sunday', async () => {
    await yh.getPrice('ticker', 1696089600);

    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v8/finance/chart/ticker?period1=1695945600&period2=1696031999&interval=1d',
    );
  });

  it('fails gracefully when no quote data', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: null,
              },
              indicators: {
                quote: [{}],
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));

    await expect(yh.getPrice('SGDCAD=X', 1684139670)).rejects.toThrow(
      'no historical data for \'SGDCAX=X\' found',
    );
    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v8/finance/chart/SGDCAX=X?period1=1684108800&period2=1684195199&interval=1d',
    );
  });
});
