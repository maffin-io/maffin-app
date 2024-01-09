import { Price } from '@/book/entities';
import { getPrices } from '@/lib/queries';

describe('getPrices', () => {
  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(Price, 'find').mockResolvedValue([{ guid: '1' }]);
  });

  it('calls Price.find with commodity', async () => {
    const prices = await getPrices({ from: 'guid' });

    expect(prices).toEqual([{ guid: '1' }]);
    expect(Price.find).toBeCalledWith({
      where: {
        fk_commodity: {
          guid: 'guid',
        },
        fk_currency: {
          guid: undefined,
        },
      },
      order: {
        date: 'ASC',
      },
    });
  });

  it('calls Price.find with currency', async () => {
    const prices = await getPrices({ to: 'guid' });

    expect(prices).toEqual([{ guid: '1' }]);
    expect(Price.find).toBeCalledWith({
      where: {
        fk_commodity: {
          guid: undefined,
        },
        fk_currency: {
          guid: 'guid',
        },
      },
      order: {
        date: 'ASC',
      },
    });
  });

  it('calls Price.find with commodity and currency', async () => {
    const prices = await getPrices({ from: 'guid', to: 'guid' });

    expect(prices).toEqual([{ guid: '1' }]);
    expect(Price.find).toBeCalledWith({
      where: {
        fk_commodity: {
          guid: 'guid',
        },
        fk_currency: {
          guid: 'guid',
        },
      },
      order: {
        date: 'ASC',
      },
    });
  });
});
