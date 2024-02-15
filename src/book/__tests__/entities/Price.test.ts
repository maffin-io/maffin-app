import { DateTime } from 'luxon';
import { DataSource, BaseEntity } from 'typeorm';

import {
  Commodity,
  Price,
} from '../../entities';

describe('Price', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('Entity', () => {
    let commodity1: Commodity;
    let commodity2: Commodity;

    beforeEach(async () => {
      commodity1 = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'EUR',
      }).save();

      commodity2 = await Commodity.create({
        namespace: 'CURRENCY',
        mnemonic: 'USD',
      }).save();

      await Price.create({
        fk_commodity: commodity1,
        fk_currency: commodity2,
        date: DateTime.fromISO('2023-01-01'),
        valueNum: 10,
        valueDenom: 100,
      }).save();
    });

    it('is active record', async () => {
      const prices = await Price.find();
      expect(prices[0]).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve price entry', async () => {
      const prices = await Price.find();

      expect(prices[0].date.toISODate()).toEqual('2023-01-01');
      expect(prices[0].commodity.mnemonic).toEqual('EUR');
      expect(prices[0].currency.mnemonic).toEqual('USD');
    });

    it('calculates value', async () => {
      const prices = await Price.find();
      expect(prices[0].value).toEqual(0.1);
    });

    it('returns quote info when available', async () => {
      await Price.create({
        fk_commodity: commodity1,
        fk_currency: commodity2,
        date: DateTime.fromISO('2023-01-02'),
        source: `maffin::${JSON.stringify({
          changeAbs: 10.1,
          changePct: 1.1,
        })}`,
        valueNum: 10,
        valueDenom: 100,
      }).save();

      const prices = await Price.find();

      expect(prices[1].quoteInfo).toEqual({
        changeAbs: 10.1,
        changePct: 1.1,
      });
    });

    it('can set value', async () => {
      const prices = await Price.find();
      const price = prices[0];
      price.value = 1000;
      expect(price.valueNum).toEqual(1000);
      expect(price.valueDenom).toEqual(1);
    });

    it('upserts price', async () => {
      let prices = await Price.find();
      expect(prices).toHaveLength(1);
      expect(prices[0].value).toEqual(0.1);

      await Price.create({
        fk_commodity: commodity1,
        fk_currency: commodity2,
        date: DateTime.fromISO('2023-01-01'),
        source: `maffin::${JSON.stringify({
          changeAbs: 10.1,
          changePct: 1.1,
        })}`,
        valueNum: 20,
        valueDenom: 100,
      }).save();

      prices = await Price.find();
      expect(prices).toHaveLength(1);
      expect(prices[0].value).toEqual(0.2);
    });
  });
});

describe('caching', () => {
  let mockInvalidateQueries: jest.Mock;
  let datasource: DataSource;

  beforeEach(async () => {
    mockInvalidateQueries = jest.fn();

    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity, Price],
      synchronize: true,
      logging: false,
      extra: {
        queryClient: {
          invalidateQueries: mockInvalidateQueries,
        },
      },
    });

    await datasource.initialize();

    // @ts-ignore
    jest.spyOn(Price, 'upsert').mockImplementation();
    // @ts-ignore
    jest.spyOn(BaseEntity.prototype, 'remove').mockImplementation();
  });

  it('invalidates keys when saving', async () => {
    const price = new Price();
    price.fk_commodity = {
      guid: 'ticker',
      namespace: 'CUSTOM',
    } as Commodity;

    await price.save();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'ticker' }],
      refetchType: 'all',
    });
    expect(Price.upsert).toBeCalledWith(
      [price],
      {
        conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
      },
    );
  });

  it('invalidates currency keys when commodity is currency', async () => {
    const price = new Price();
    price.fk_commodity = {
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity;
    price.fk_currency = {
      guid: 'usd',
    } as Commodity;

    await price.save();

    expect(mockInvalidateQueries).toBeCalledTimes(2);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'eur' }],
      refetchType: 'all',
    });
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'usd' }],
      refetchType: 'all',
    });
  });

  it('invalidates keys when deleting', async () => {
    const price = new Price();
    price.fk_commodity = {
      guid: 'ticker',
      namespace: 'CUSTOM',
    } as Commodity;

    await price.remove();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'ticker' }],
      refetchType: 'all',
    });
  });
});
