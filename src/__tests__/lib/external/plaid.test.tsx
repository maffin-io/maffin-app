import { Account, Commodity } from '@/book/entities';
import { AccountType, TransactionsSyncResponse } from 'plaid';

import { createEntitiesFromData } from '@/lib/external/plaid';

describe('createEntitiesFromData', () => {
  let eur: Commodity;
  let assetsRoot: Account;

  beforeEach(() => {
    eur = {
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;
    jest.spyOn(Commodity, 'findOneBy').mockResolvedValue(eur);

    assetsRoot = {
      type: 'ROOT',
      guid: 'root',
    } as Account;
    jest.spyOn(Account, 'findOneByOrFail').mockResolvedValue(assetsRoot);

    jest.spyOn(Account, 'create').mockReturnValue({
      save: jest.fn() as Function,
    } as Account);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates account', async () => {
    await createEntitiesFromData({
      accounts: [
        {
          persistent_account_id: 'guid',
          name: 'Name',
          balances: {
            iso_currency_code: 'EUR',
          },
        },
      ],
    } as TransactionsSyncResponse);

    expect(Commodity.findOneBy).toBeCalledWith({
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    });
    expect(Account.findOneByOrFail).toBeCalledWith({
      type: 'ASSET',
      parent: {
        type: 'ROOT',
      },
    });
    expect(Account.create).toBeCalledWith({
      name: 'Name',
      guid: 'plaid-guid',
      description: 'Synced account',
      type: 'BANK',
      fk_commodity: eur,
      parent: assetsRoot,
    });
  });

  it.each([
    [AccountType.Credit, 'CREDIT'],
    [AccountType.Loan, 'LIABILITY'],
  ])('creates account type %s', async (type, expected) => {
    await createEntitiesFromData({
      accounts: [
        {
          persistent_account_id: 'guid',
          name: 'Name',
          type,
          balances: {
            iso_currency_code: 'EUR',
          },
        },
      ],
    } as TransactionsSyncResponse);

    expect(Account.create).toBeCalledWith(expect.objectContaining({
      type: expected,
    }));
  });

  it('creates new commodity it not existing', async () => {
    const usd = {
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    };
    jest.spyOn(Commodity, 'findOneBy').mockResolvedValue(null);
    jest.spyOn(Commodity, 'create').mockReturnValue({
      save: () => usd as Partial<Commodity>,
    } as Commodity);

    await createEntitiesFromData({
      accounts: [
        {
          persistent_account_id: 'guid',
          name: 'Name',
          balances: {
            iso_currency_code: 'USD',
          },
        },
      ],
    } as TransactionsSyncResponse);

    expect(Commodity.create).toBeCalledWith(usd);
    expect(Account.create).toBeCalledWith(expect.objectContaining({
      fk_commodity: usd,
    }));
  });
});
