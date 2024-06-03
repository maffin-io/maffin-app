import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  BankConfig,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { initInvestment, getInvestments } from '@/lib/queries/getInvestments';
import { PriceDBMap } from '@/book/prices';
import { InvestmentAccount } from '@/book/models';
import * as getPrices from '@/lib/queries/getPrices';
import * as getMainCurrency from '@/lib/queries/getMainCurrency';

jest.mock('@/book/models', () => ({
  InvestmentAccount: jest.fn(),
}));

jest.mock('@/lib/queries/getMainCurrency', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries/getMainCurrency'),
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
  let eur: Commodity;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, BankConfig, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      guid: 'eur_guid',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    }).save();

    price1 = Price.create({
      fk_commodity: {
        guid: 'ticker_guid_1',
        mnemonic: 'TICKER1',
      },
      fk_currency: eur,
      date: DateTime.fromISO('2023-01-01'),
    });
    price2 = Price.create({
      fk_commodity: {
        guid: 'ticker_guid_2',
        mnemonic: 'TICKER2',
      },
      fk_currency: eur,
      date: DateTime.fromISO('2023-01-01'),
    });

    jest.spyOn(getMainCurrency, 'default').mockResolvedValue(eur);

    // @ts-ignore
    (InvestmentAccount as jest.Mock).mockReturnValue({ guid: 'investment_guid' });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await datasource.destroy();
  });

  describe('initInvestment', () => {
    it('returns investment as expected', async () => {
      mockGetPrices = jest.spyOn(getPrices, 'default')
        .mockResolvedValueOnce(new PriceDBMap([price1]));

      const account1 = Account.create({
        name: 'TICKER1',
        type: 'INVESTMENT',
        fk_commodity: {
          guid: 'ticker_guid_1',
          mnemonic: 'TICKER1',
        },
        parent: jest.fn(),
      });

      const investment = await initInvestment(
        account1,
        eur,
        [{ guid: 'split1' } as Split],
      );

      expect(investment).toEqual({ guid: 'investment_guid' });
      expect(mockGetPrices).toBeCalledTimes(1);
      expect(mockGetPrices).toHaveBeenNthCalledWith(1, { from: account1.commodity });
      expect(InvestmentAccount).toHaveBeenCalledWith(
        account1,
        [{ guid: 'split1' }],
        'EUR',
        new PriceDBMap([price1]),
      );
    });

    it('retrieves prices for currency when it is not main currency', async () => {
      const usd = await Commodity.create({
        mnemonic: 'USD',
        guid: 'usd_guid',
        namespace: 'CURRENCY',
      }).save();
      price1 = Price.create({
        fk_commodity: {
          guid: 'ticker_guid_1',
          mnemonic: 'TICKER1',
        },
        fk_currency: usd,
        date: DateTime.fromISO('2023-01-01'),
      });
      price2 = Price.create({
        fk_commodity: usd,
        fk_currency: eur,
        date: DateTime.fromISO('2023-01-01'),
      });
      mockGetPrices = jest.spyOn(getPrices, 'default')
        .mockResolvedValueOnce(new PriceDBMap([price1]))
        .mockResolvedValueOnce(new PriceDBMap([price2]));

      const account1 = Account.create({
        name: 'TICKER1',
        type: 'INVESTMENT',
        fk_commodity: {
          guid: 'ticker_guid_1',
          mnemonic: 'TICKER1',
        },
        parent: jest.fn(),
      });

      const investment = await initInvestment(
        account1,
        eur,
        [{ guid: 'split1' } as Split],
      );

      expect(investment).toEqual({ guid: 'investment_guid' });
      expect(mockGetPrices).toBeCalledTimes(2);
      expect(mockGetPrices).toHaveBeenNthCalledWith(1, { from: account1.commodity });
      expect(mockGetPrices).toHaveBeenNthCalledWith(2, { from: usd, to: eur });
      expect(InvestmentAccount).toHaveBeenCalledWith(
        account1,
        [{ guid: 'split1' }],
        'EUR',
        new PriceDBMap([price2, price1]),
      );
    });
  });

  describe('getInvestments', () => {
    let account1: Account;
    let account2: Account;
    let splits: Split[];

    beforeEach(() => {
      account1 = Account.create({
        name: 'TICKER1',
        type: 'INVESTMENT',
        fk_commodity: {
          guid: 'ticker_guid_1',
          mnemonic: 'TICKER1',
        },
        parent: jest.fn(),
      });
      account2 = Account.create({
        name: 'TICKER2',
        type: 'INVESTMENT',
        fk_commodity: {
          guid: 'ticker_guid_2',
          mnemonic: 'TICKER2',
        },
        parent: jest.fn(),
      });

      splits = [
        { guid: 'split1', accountId: account1.guid } as Split,
        { guid: 'split2', accountId: account2.guid } as Split,
      ];
    });

    it('returns multiple investments', async () => {
      jest.spyOn(getPrices, 'default')
        .mockResolvedValueOnce(new PriceDBMap([price1]))
        .mockResolvedValueOnce(new PriceDBMap([price2]));

      await getInvestments(
        [account1, account2],
        splits,
        eur,
      );

      expect(InvestmentAccount).toHaveBeenNthCalledWith(
        1,
        account1,
        [splits[0]],
        'EUR',
        new PriceDBMap([price1]),
      );

      expect(InvestmentAccount).toHaveBeenNthCalledWith(
        2,
        account2,
        [splits[1]],
        'EUR',
        new PriceDBMap([price2]),
      );
    });
  });
});
