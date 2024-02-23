import { Commodity, Price } from '@/book/entities';
import { getPrices } from '@/lib/queries';

describe('getPrices', () => {
  let price1: Price;
  let price2: Price;

  beforeEach(() => {
    price1 = new Price();
    price1.guid = '1';
    price1.fk_commodity = { mnemonic: 'EUR' } as Commodity;
    price1.fk_currency = { mnemonic: 'USD' } as Commodity;
    price1.value = 1;

    price2 = new Price();
    price2.guid = '2';
    price2.fk_commodity = { mnemonic: 'USD' } as Commodity;
    price2.fk_currency = { mnemonic: 'EUR' } as Commodity;
    price2.value = 2;

    jest.spyOn(Price, 'find')
      .mockResolvedValue([price1]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls Price.find with from parameter', async () => {
    const prices = await getPrices({ from: { guid: 'guid' } as Commodity });

    expect(prices.prices).toEqual([price1]);
    expect(Price.find).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          fk_commodity: {
            guid: 'guid',
          },
          fk_currency: {
            guid: undefined,
          },
        },
      },
    );
  });

  it('retrieves reverse prices when commodity is a currency', async () => {
    jest.spyOn(Price, 'find')
      .mockResolvedValueOnce([price1])
      .mockResolvedValueOnce([price2]);

    const prices = await getPrices({ from: { guid: 'guid', namespace: 'CURRENCY' } as Commodity });

    expect(prices.prices).toEqual([
      price1,
      expect.objectContaining({
        fk_commodity: { mnemonic: 'EUR' },
        fk_currency: { mnemonic: 'USD' },
        valueNum: 5,
        valueDenom: 10,
      }),
    ]);

    expect(Price.find).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          fk_commodity: {
            guid: 'guid',
          },
          fk_currency: {
            guid: undefined,
          },
        },
      },
    );
    expect(Price.find).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          fk_commodity: {
            guid: undefined,
            namespace: 'CURRENCY',
          },
          fk_currency: {
            guid: 'guid',
          },
        },
      },
    );
  });

  it('calls Price.find with currency', async () => {
    const prices = await getPrices({ to: { guid: 'guid' } as Commodity });

    expect(prices.prices).toEqual([price1]);
    expect(Price.find).toBeCalledWith({
      where: {
        fk_commodity: {
          guid: undefined,
        },
        fk_currency: {
          guid: 'guid',
        },
      },
    });
  });

  it('calls Price.find with from and to parameters', async () => {
    jest.spyOn(Price, 'find')
      .mockResolvedValueOnce([price1])
      .mockResolvedValueOnce([price2]);

    const prices = await getPrices({
      from: { guid: 'guid1', namespace: 'CURRENCY' } as Commodity,
      to: { guid: 'guid2', namespace: 'CURRENCY' } as Commodity,
    });

    expect(prices.prices).toEqual([
      price1,
      expect.objectContaining({
        fk_commodity: { mnemonic: 'EUR' },
        fk_currency: { mnemonic: 'USD' },
        valueNum: 5,
        valueDenom: 10,
      }),
    ]);

    expect(Price.find).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          fk_commodity: {
            guid: 'guid1',
          },
          fk_currency: {
            guid: 'guid2',
          },
        },
      },
    );
    expect(Price.find).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          fk_commodity: {
            guid: 'guid2',
            namespace: 'CURRENCY',
          },
          fk_currency: {
            guid: 'guid1',
          },
        },
      },
    );
  });
});
