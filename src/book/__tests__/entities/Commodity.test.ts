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

    it('calculates stockerId as expected', () => {
      instance = Commodity.create({
        namespace: 'namespace',
        mnemonic: 'mnemonic',
      });

      expect(instance.stockerId).toEqual('mnemonic');

      instance.cusip = 'cusip';
      expect(instance.stockerId).toEqual('cusip');
    });
  });
});
