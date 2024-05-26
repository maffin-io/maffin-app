import { getTodayPrices } from '@/app/actions';
import * as yahoo from '@/lib/external/yahoo';

jest.mock('@/lib/external/yahoo', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/external/yahoo'),
}));

describe('getTodayPrices', () => {
  it('calls getPrices', async () => {
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
