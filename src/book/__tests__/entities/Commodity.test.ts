import { DataSource, BaseEntity } from 'typeorm';

import { Commodity } from '../../entities';

describe('Commodity', () => {
  let instance: Commodity;
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  describe('entity', () => {
    beforeEach(async () => {
      instance = Commodity.create({
        namespace: 'namespace',
        mnemonic: 'mnemonic',
      });

      await instance.save();
    });

    it('is active record', () => {
      expect(instance).toBeInstanceOf(BaseEntity);
    });

    it('can retrieve commodity', async () => {
      const commodities = await Commodity.find();

      expect(commodities).toEqual([
        {
          guid: expect.any(String),
          fullname: '',
          cusip: null,
          mnemonic: 'mnemonic',
          namespace: 'namespace',
        },
      ]);
    });

    it('calculates exchangeId as expected', () => {
      instance = Commodity.create({
        namespace: 'namespace',
        mnemonic: 'mnemonic',
      });

      expect(instance.exchangeId).toEqual('mnemonic');

      instance.cusip = 'cusip';
      expect(instance.exchangeId).toEqual('cusip');
    });

    it('cannot create same commodity', async () => {
      await expect(Commodity.create({
        namespace: 'namespace',
        mnemonic: 'mnemonic',
      }).save()).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('validation', () => {
    it('fails if currency with not correct length', async () => {
      const c = Commodity.create({
        mnemonic: 'EU',
        namespace: 'CURRENCY',
      });

      await expect(c.save()).rejects.toThrow('checkCurrencyCode');
    });
  });
});

describe('caching', () => {
  let datasource: DataSource;
  let mockInvalidateQueries: jest.Mock;

  beforeEach(async () => {
    mockInvalidateQueries = jest.fn();

    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity],
      synchronize: true,
      logging: false,
      extra: {
        queryClient: {
          invalidateQueries: mockInvalidateQueries,
        },
      },
    });
    await datasource.initialize();

    jest.spyOn(BaseEntity.prototype, 'save').mockImplementation();
    jest.spyOn(BaseEntity.prototype, 'remove').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates keys when saving', async () => {
    const c = new Commodity();
    c.fullname = 'name';

    await c.save();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'commodities'],
    });
  });

  it('invalidates keys when deleting', async () => {
    const c = new Commodity();
    c.fullname = 'name';

    await c.remove();

    expect(mockInvalidateQueries).toBeCalledTimes(1);
    expect(mockInvalidateQueries).toBeCalledWith({
      queryKey: ['api', 'commodities'],
    });
  });
});
