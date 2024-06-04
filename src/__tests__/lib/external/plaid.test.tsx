import { Account, BankConfig, Commodity } from '@/book/entities';
import { AccountType, TransactionsSyncResponse } from 'plaid';

import { createAccounts, createConfig } from '@/lib/external/plaid';

describe('createConfig', () => {
  beforeEach(() => {
    jest.spyOn(BankConfig, 'findOneBy').mockResolvedValue({
      guid: 'guid',
      token: 'token',
    } as BankConfig);
  });

  it('fails if config exists', async () => {
    await expect(createConfig('ins_123')).rejects.toThrow('This institution is already linked');
  });

  it('creates new config when not existing', async () => {
    jest.spyOn(BankConfig, 'findOneBy').mockResolvedValue(null);
    const mockSave = jest.fn((e) => e);
    jest.spyOn(BankConfig, 'create').mockReturnValue({
      guid: 'guid',
      save: mockSave as Function,
    } as BankConfig);

    await createConfig('ins_123');
    expect(BankConfig.create).toHaveBeenCalledWith({
      guid: 'ins_123',
      token: '',
    });
    expect(mockSave).toHaveBeenCalled();
  });
});

describe('create accounts', () => {
  let eur: Commodity;
  let assetsRoot: Account;
  let config: BankConfig;

  beforeEach(() => {
    config = {
      guid: 'guid',
      token: 'token',
      save: jest.fn() as Function,
    } as BankConfig;

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
    await createAccounts(
      config,
      [
        {
          account_id: 'guid',
          name: 'Name',
          balances: {
            iso_currency_code: 'EUR',
          },
        },
      ] as TransactionsSyncResponse['accounts'],
    );

    expect(Commodity.findOneBy).toHaveBeenCalledWith({
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    });
    expect(Account.findOneByOrFail).toHaveBeenCalledWith({
      type: 'ASSET',
      parent: {
        type: 'ROOT',
      },
    });
    expect(Account.create).toHaveBeenCalledWith({
      name: 'Name',
      guid: 'guid',
      description: 'Online banking account',
      type: 'BANK',
      fk_commodity: eur,
      parent: assetsRoot,
      fk_config: config,
    });
  });

  it.each([
    [AccountType.Credit, 'CREDIT'],
    [AccountType.Loan, 'LIABILITY'],
  ])('creates account type %s', async (type, expected) => {
    await createAccounts(
      config,
      [
        {
          account_id: 'guid',
          name: 'Name',
          type,
          balances: {
            iso_currency_code: 'EUR',
          },
        },
      ] as TransactionsSyncResponse['accounts'],
    );

    expect(Account.create).toHaveBeenCalledWith(expect.objectContaining({
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

    await createAccounts(
      config,
      [
        {
          account_id: 'guid',
          name: 'Name',
          balances: {
            iso_currency_code: 'USD',
          },
        },
      ] as TransactionsSyncResponse['accounts'],
    );

    expect(Commodity.create).toHaveBeenCalledWith(usd);
    expect(Account.create).toHaveBeenCalledWith(expect.objectContaining({
      fk_commodity: usd,
    }));
  });
});
