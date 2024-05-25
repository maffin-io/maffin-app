import { PlaidApi } from 'plaid';
import type { AxiosResponse } from 'axios';

import { createLinkToken, createAccessToken, getTransactions } from '@/app/actions/plaid';

jest.mock('plaid');

describe('createLinkToken', () => {
  beforeEach(() => {
    jest.spyOn(PlaidApi.prototype, 'linkTokenCreate').mockResolvedValue({
      data: {
        link_token: 'token',
      },
    } as AxiosResponse);
  });

  it('returns link token', async () => {
    const token = await createLinkToken('user-id');

    expect(PlaidApi.prototype.linkTokenCreate).toBeCalledWith({
      client_name: 'Maffin',
      country_codes: ['ES'],
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
    jest.spyOn(PlaidApi.prototype, 'itemPublicTokenExchange').mockResolvedValue({
      data: {
        access_token: 'token',
      },
    } as AxiosResponse);
  });

  it('returns access token', async () => {
    const token = await createAccessToken('token');

    expect(PlaidApi.prototype.itemPublicTokenExchange).toBeCalledWith({
      public_token: 'token',
    });
    expect(token).toEqual('token');
  });
});

describe('getTransactions', () => {
  beforeEach(() => {
    jest.spyOn(PlaidApi.prototype, 'transactionsSync').mockResolvedValue({
      data: {
        accounts: {},
      },
    } as AxiosResponse);
  });

  it('returns transactions', async () => {
    const token = await getTransactions('token');

    expect(PlaidApi.prototype.transactionsSync).toBeCalledWith({
      access_token: 'token',
    });
    expect(token).toEqual({ accounts: {} });
  });
});
