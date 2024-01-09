import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getInvestment, getInvestments } from '@/lib/queries';
import { PriceDBMap } from '@/book/prices';
import { InvestmentAccount } from '@/book/models';
import * as getPrices from '@/lib/queries/getPrices';

jest.mock('@/book/models', () => ({
  InvestmentAccount: jest.fn(),
}));

jest.mock('@/lib/queries/getMainCurrency', () => ({
  __esModule: true,
  default: async () => ({
    guid: 'eur',
    mnemonic: 'EUR',
  }) as Commodity,
}));

jest.mock('@/lib/queries/getPrices', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries/getPrices'),
}));

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
}));

describe('getInvestments', () => {
  let datasource: DataSource;
  let mockGetPrices: jest.SpyInstance;
  let price1: Price;
  let price2: Price;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    price1 = Price.create({
      fk_commodity: {
        mnemonic: 'TICKER',
      },
      fk_currency: {
        mnemonic: 'EUR',
      },
      date: DateTime.now(),
    });
    price2 = Price.create({
      fk_commodity: {
        mnemonic: 'TICKER',
      },
      fk_currency: {
        mnemonic: 'EUR',
      },
      date: DateTime.now(),
    });

    // @ts-ignore
    (InvestmentAccount as jest.Mock).mockReturnValue({ guid: 'investment_guid' });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await datasource.destroy();
  });

  describe('getInvestments', () => {
    let mockAccountFind: jest.SpyInstance;

    beforeEach(() => {
      mockAccountFind = jest.spyOn(Account, 'find');
    });

    it('returns empty investments when no investment accounts', async () => {
      const investments = await getInvestments();

      expect(investments).toEqual([]);
    });

    it('creates investment account with expected params', async () => {
      mockGetPrices = jest.spyOn(getPrices, 'default')
        .mockResolvedValueOnce([price1])
        .mockResolvedValueOnce([price2])
        .mockResolvedValueOnce([price1])
        .mockResolvedValueOnce([price2]);

      const account1 = Account.create({
        name: 'TICKER1',
        type: 'STOCK',
        fk_commodity: {
          guid: 'googl_guid',
          mnemonic: 'GOOGL',
        },
        parent: jest.fn(),
      });
      const account2 = Account.create({
        name: 'TICKER2',
        type: 'STOCK',
        fk_commodity: {
          guid: 'nvda_guid',
          mnemonic: 'NVDA',
        },
        parent: jest.fn(),
      });
      mockAccountFind.mockResolvedValue([account1, account2]);

      const investments = await getInvestments();

      expect(investments).toEqual([{ guid: 'investment_guid' }, { guid: 'investment_guid' }]);
      expect(mockAccountFind).toHaveBeenCalledWith({
        where: [
          { type: 'STOCK' },
          { type: 'MUTUAL' },
        ],
        relations: {
          splits: {
            fk_transaction: {
              splits: {
                fk_account: true,
              },
            },
          },
        },
        order: {
          splits: {
            fk_transaction: {
              date: 'ASC',
            },
          },
        },
      });
      expect(mockGetPrices).toHaveBeenNthCalledWith(1, { from: account1.commodity.guid });
      expect(mockGetPrices).toHaveBeenNthCalledWith(2, { to: 'eur' });
      expect(mockGetPrices).toHaveBeenNthCalledWith(3, { from: account2.commodity.guid });
      expect(mockGetPrices).toHaveBeenNthCalledWith(4, { to: 'eur' });
      expect(InvestmentAccount).toHaveBeenCalledWith(account1, 'EUR', new PriceDBMap([price2, price1]));
      expect(InvestmentAccount).toHaveBeenCalledWith(account2, 'EUR', new PriceDBMap([price2, price1]));
    });
  });

  describe('getInvestment', () => {
    let mockAccountFindOne: jest.SpyInstance;

    beforeEach(() => {
      mockAccountFindOne = jest.spyOn(Account, 'findOneOrFail');
    });

    it('fails if investment not found', async () => {
      mockAccountFindOne.mockImplementation(async () => { throw new Error('hi'); });

      await expect(getInvestment('guid')).rejects.toThrow('hi');
    });

    it('returns investment as expected', async () => {
      mockGetPrices = jest.spyOn(getPrices, 'default')
        .mockResolvedValueOnce([price1])
        .mockResolvedValueOnce([price2]);

      const account1 = Account.create({
        name: 'TICKER1',
        type: 'STOCK',
        fk_commodity: {
          guid: 'googl_guid',
          mnemonic: 'GOOGL',
        },
        parent: jest.fn(),
      });
      mockAccountFindOne.mockResolvedValue(account1);

      const investments = await getInvestment('guid');

      expect(investments).toEqual({ guid: 'investment_guid' });
      expect(mockAccountFindOne).toHaveBeenCalledWith({
        where: { guid: 'guid' },
        relations: {
          splits: {
            fk_transaction: {
              splits: {
                fk_account: true,
              },
            },
          },
        },
      });

      expect(mockGetPrices).toHaveBeenNthCalledWith(1, { from: account1.commodity.guid });
      expect(mockGetPrices).toHaveBeenNthCalledWith(2, { to: 'eur' });
      expect(InvestmentAccount).toHaveBeenCalledWith(account1, 'EUR', new PriceDBMap([price2, price1]));
    });
  });
});
