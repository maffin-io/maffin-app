import { DateTime } from 'luxon';
import { BaseEntity, DeepPartial } from 'typeorm';

import { insertTodayPrices } from '@/lib/prices';
import { Commodity, Price } from '@/book/entities';
import * as queries from '@/lib/queries';
import * as actions from '@/app/actions';
import * as helpers_env from '@/helpers/env';

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/app/actions', () => ({
  __esModule: true,
  ...jest.requireActual('@/app/actions'),
}));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  get IS_PAID_PLAN() {
    return true;
  },
}));

describe('prices', () => {
  let eur: Commodity;

  describe('insertTodayPrices', () => {
    beforeEach(() => {
      eur = {
        guid: 'eur',
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      } as Commodity;

      jest.spyOn(helpers_env, 'IS_PAID_PLAN', 'get').mockReturnValue(true);
      jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
      jest.spyOn(actions, 'getTodayPrices').mockResolvedValue({});
      jest.spyOn(Commodity, 'find').mockResolvedValue([]);
      jest.spyOn(Commodity, 'findBy').mockResolvedValue([eur]);
      jest.spyOn(Price, 'upsert').mockImplementation();
      jest.spyOn(Price, 'create').mockImplementation();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('does not call when IS_PAID_PLAN is false', async () => {
      jest.spyOn(helpers_env, 'IS_PAID_PLAN', 'get').mockReturnValue(false);
      await insertTodayPrices();
      expect(Commodity.find).not.toBeCalled();
      expect(actions.getTodayPrices).not.toBeCalled();
    });

    it('works with just main currency', async () => {
      await insertTodayPrices();

      expect(actions.getTodayPrices).toBeCalledWith([]);
      expect(Price.upsert).toBeCalledWith(
        [],
        { conflictPaths: ['fk_commodity', 'fk_currency', 'date'] },
      );
    });

    it('calls with all currencies and commodities', async () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;

      const stock = {
        guid: 'stock',
        mnemonic: 'GOOGL',
        namespace: 'STOCK',
      } as Commodity;

      const fund = {
        guid: 'fund',
        mnemonic: 'IE00',
        namespace: 'FUND',
      } as Commodity;

      jest.spyOn(Commodity, 'find').mockResolvedValue([stock, fund]);
      jest.spyOn(Commodity, 'findBy').mockResolvedValue([eur, usd]);

      await insertTodayPrices();

      expect(actions.getTodayPrices).toBeCalledWith(['USDEUR=X', 'GOOGL', 'IE00']);
    });

    it('creates and upserts prices', async () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;

      const stock = {
        guid: 'stock',
        mnemonic: 'GOOGL',
        namespace: 'STOCK',
      } as Commodity;

      jest.spyOn(Commodity, 'find').mockResolvedValue([stock]);
      jest.spyOn(Commodity, 'findBy').mockResolvedValue([eur, usd]);

      jest.spyOn(Price, 'create').mockImplementation((p: DeepPartial<BaseEntity>) => p as BaseEntity);
      jest.spyOn(actions, 'getTodayPrices').mockResolvedValue({
        'USDEUR=X': {
          price: 0.987,
          currency: 'EUR',
          changeAbs: 0.1,
          changePct: 1,

        },
        GOOGL: {
          price: 100,
          currency: 'USD',
          changeAbs: 1,
          changePct: 1,
        },
      });

      await insertTodayPrices();

      const price1 = {
        date: DateTime.now(),
        fk_commodity: 'usd',
        fk_currency: 'eur',
        valueDenom: 1000,
        valueNum: 987,
        source: 'maffin::{"price":0.987,"currency":"EUR","changeAbs":0.1,"changePct":1}',
      };
      expect(Price.create).nthCalledWith(
        1,
        price1,
      );

      const price2 = {
        date: DateTime.now(),
        fk_commodity: 'stock',
        fk_currency: 'usd',
        valueDenom: 1,
        valueNum: 100,
        source: 'maffin::{"price":100,"currency":"USD","changeAbs":1,"changePct":1}',
      };
      expect(Price.create).nthCalledWith(
        2,
        price2,
      );

      expect(Price.upsert).toBeCalledWith(
        [
          price1,
          price2,
        ],
        { conflictPaths: ['fk_commodity', 'fk_currency', 'date'] },
      );
    });
  });
});
