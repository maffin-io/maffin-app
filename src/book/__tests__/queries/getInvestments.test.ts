import { DateTime } from 'luxon';
import {
  createConnection,
  getConnection,
} from 'typeorm';

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

describe('getInvestments', () => {
  let mockGetHistory: jest.SpyInstance;
  let mockGetTodayQuotes: jest.SpyInstance;
  let mockAccountFind: jest.SpyInstance;
  let price1: Price;
  let price2: Price;

  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity, Account, Split, Transaction, Price],
      synchronize: true,
      logging: false,
    });

    price1 = Price.create({
      guid: 'price1',
      fk_commodity: {
        mnemonic: 'TICKER',
      },
      fk_currency: {
        mnemonic: 'EUR',
      },
      date: DateTime.now(),
    });
    price2 = Price.create({
      guid: 'price2',
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
    // @ts-ignore
    InvestmentAccount.mockReturnValue({ guid: 'investment_guid' });
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('returns empty investments when no investment accounts', async () => {
    const investments = await getInvestments('EUR');

    expect(investments).toEqual([]);
  });

  it('creates investment account with expected params', async () => {
    const account = Account.create({
      guid: 'account_guid',
      name: 'TICKER',
      type: 'STOCK',
      fk_commodity: {
        mnemonic: 'EUR',
      },
      parent: jest.fn(),
    });
    mockAccountFind = jest.spyOn(Account, 'find').mockResolvedValue([account]);

    await getInvestments('EUR');

    expect(mockAccountFind).toHaveBeenCalledWith({
      where: [
        { type: 'STOCK' },
        { type: 'MUTUAL' },
      ],
      relations: {
        splits: {
          fk_transaction: {
            splits: true,
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
