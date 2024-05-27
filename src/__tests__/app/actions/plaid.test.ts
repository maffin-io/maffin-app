import * as plaid from 'plaid';
import type { AxiosResponse } from 'axios';

import { createLinkToken, createAccessToken, getTransactions } from '@/app/actions';
import * as jwt from '@/lib/jwt';

jest.mock('plaid');

jest.mock('@/lib/jwt', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/jwt'),
}));

describe('createLinkToken', () => {
  beforeEach(() => {
    jest.spyOn(plaid.PlaidApi.prototype, 'linkTokenCreate').mockResolvedValue({
      data: {
        link_token: 'token',
      },
    } as AxiosResponse);
    jest.spyOn(jwt, 'verify').mockImplementation();
    jest.spyOn(jwt, 'getRoles').mockResolvedValue({ isPremium: true, isBeta: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws error when token not verified', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('fail'); });

    await expect(() => createLinkToken({
      userId: 'user-id',
    })).rejects.toThrow('fail');
  });

  it('returns empty when not beta user', async () => {
    jest.spyOn(jwt, 'getRoles').mockResolvedValue({ isPremium: true, isBeta: false });

    const token = await createLinkToken({
      userId: 'user-id',
    });

    expect(token).toEqual('');
  });

  it('returns link token', async () => {
    const token = await createLinkToken({ userId: 'user-id' });

    expect(plaid.PlaidApi.prototype.linkTokenCreate).toBeCalledWith({
      client_name: 'Maffin',
      country_codes: Object.values(plaid.CountryCode),
      language: 'en',
      products: ['transactions'],
      user: {
        client_user_id: 'user-id',
      },
    });
    expect(token).toEqual('token');
  });
});

describe('createAccessToken', () => {
  beforeEach(() => {
    jest.spyOn(plaid.PlaidApi.prototype, 'itemPublicTokenExchange').mockResolvedValue({
      data: {
        access_token: 'token',
      },
    } as AxiosResponse);
  });

  it('returns access token', async () => {
    const token = await createAccessToken('token');

    expect(plaid.PlaidApi.prototype.itemPublicTokenExchange).toBeCalledWith({
      public_token: 'token',
    });
    expect(token).toEqual('token');
  });
});

describe('getTransactions', () => {
  beforeEach(() => {
    jest.spyOn(plaid.PlaidApi.prototype, 'transactionsSync').mockResolvedValue({
      data: {
        accounts: {},
      },
    } as AxiosResponse);
  });

  it('returns transactions', async () => {
    const token = await getTransactions('token');

    expect(plaid.PlaidApi.prototype.transactionsSync).toBeCalledWith({
      access_token: 'token',
    });
    expect(token).toEqual({ accounts: {} });
  });
});
