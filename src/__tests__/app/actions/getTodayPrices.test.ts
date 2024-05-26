import { getTodayPrices } from '@/app/actions';
import * as yahoo from '@/lib/external/yahoo';
import * as jwt from '@/lib/jwt';

jest.mock('@/lib/external/yahoo', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/external/yahoo'),
}));

jest.mock('@/lib/jwt', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/jwt'),
}));

describe('getTodayPrices', () => {
  beforeEach(() => {
    jest.spyOn(jwt, 'verify').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws error when token not verified', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('fail'); });

    await expect(() => getTodayPrices({
      tickers: ['A'],
    })).rejects.toThrow('fail');
  });

  it('returns empty when not premium user', async () => {
    jest.spyOn(jwt, 'isPremium').mockResolvedValue(false);
    jest.spyOn(yahoo, 'default').mockImplementation();

    const prices = await getTodayPrices({
      tickers: ['A'],
    });

    expect(prices).toEqual({});
    expect(yahoo.default).not.toBeCalled();
  });

  it('calls getPrices when premium user', async () => {
    jest.spyOn(jwt, 'isPremium').mockResolvedValue(true);

    const yahooPrices = {
      A: {
        price: 100,
        currency: 'USD',
        changeAbs: 1,
        changePct: 1,
      },
    };
    jest.spyOn(yahoo, 'default').mockResolvedValue(yahooPrices);

    const prices = await getTodayPrices({
      tickers: ['A'],
    });

    expect(prices).toEqual(yahooPrices);
    expect(yahoo.default).toBeCalledWith(['A']);
  });
});
