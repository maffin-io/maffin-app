import {
  createConnection,
  getConnection,
  BaseEntity,
} from 'typeorm';

import { Commodity } from '../../entities';

describe('Commodity', () => {
  let instance: Commodity;

  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity],
      synchronize: true,
      logging: false,
    });
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  describe('entity', () => {
    beforeEach(async () => {
      instance = Commodity.create({
        guid: 'guid',
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
          guid: 'guid',
          cusip: null,
          mnemonic: 'mnemonic',
          namespace: 'namespace',
        },
      ]);
    });

    it('calculates stockerId as expected', () => {
      instance = Commodity.create({
        guid: 'guid',
        namespace: 'namespace',
        mnemonic: 'mnemonic',
      });

      expect(instance.stockerId).toEqual('mnemonic');

      instance.cusip = 'cusip';
      expect(instance.stockerId).toEqual('cusip');
    });
  });
});
