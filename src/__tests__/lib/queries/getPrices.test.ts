import { Price } from '@/book/entities';
import { getPrices } from '@/lib/queries';

describe('getPrices', () => {
  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(Price, 'find').mockResolvedValue([{ guid: '1' }]);
  });
  it('calls Price.find as expected', async () => {
    const prices = await getPrices('guid');

    expect(prices).toEqual([{ guid: '1' }]);
    expect(Price.find).toBeCalledWith({
      where: {
        fk_commodity: {
          guid: 'guid',
        },
      },
      order: {
        date: 'ASC',
      },
    });
  });
});
