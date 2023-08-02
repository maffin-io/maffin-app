import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '../../entities';
import { getInvestments } from '../../queries';
import { PriceDB, PriceDBMap } from '../../prices';
import { InvestmentAccount } from '../../models';

jest.mock('../../models', () => ({
  InvestmentAccount: jest.fn(),
}));

jest.mock('../../queries/getMainCurrency', () => ({
  __esModule: true,
  getMainCurrency: async () => ({
    guid: 'eur',
    mnemonic: 'EUR',
  }) as Commodity,
}));

describe('getInvestments', () => {
  let datasource: DataSource;
  let mockGetHistory: jest.SpyInstance;
  let mockGetTodayQuotes: jest.SpyInstance;
  let mockAccountFind: jest.SpyInstance;
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
    mockGetTodayQuotes = jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue(new PriceDBMap([price1]));
    mockGetHistory = jest.spyOn(PriceDB, 'getHistory').mockResolvedValue(new PriceDBMap([price2]));
    mockAccountFind = jest.spyOn(Account, 'find').mockResolvedValue([]);
    (InvestmentAccount as jest.Mock).mockReturnValue({ guid: 'investment_guid' });
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('returns empty investments when no investment accounts', async () => {
    const investments = await getInvestments();

    expect(investments).toEqual([]);
  });

  it('creates investment account with expected params', async () => {
    const account = Account.create({
      name: 'TICKER',
      type: 'STOCK',
      fk_commodity: {
        mnemonic: 'EUR',
      },
      parent: jest.fn(),
    });
    mockAccountFind = jest.spyOn(Account, 'find').mockResolvedValue([account]);

    await getInvestments();

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
    expect(mockGetTodayQuotes).toHaveBeenCalledWith();
    expect(mockGetHistory).toHaveBeenCalledWith('EUR');
    expect(InvestmentAccount).toHaveBeenCalledWith(account, 'EUR', new PriceDBMap([price2, price1]));
  });
});
