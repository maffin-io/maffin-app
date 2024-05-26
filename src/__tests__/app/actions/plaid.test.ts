import * as plaid from 'plaid';
import type { AxiosResponse } from 'axios';

import { createLinkToken, createAccessToken, getTransactions } from '@/app/actions/plaid';

jest.mock('plaid');

describe('createLinkToken', () => {
  beforeEach(() => {
    jest.spyOn(plaid.PlaidApi.prototype, 'linkTokenCreate').mockResolvedValue({
      data: {
        link_token: 'token',
      },
    } as AxiosResponse);
  });

  it('returns link token', async () => {
    const token = await createLinkToken('user-id');

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
