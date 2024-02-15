import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useAccount, useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';

jest.mock('@tanstack/react-query');

describe('useAccount', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid',
    } as Account;
    // @ts-ignore
    jest.spyOn(Account, 'findOneBy').mockResolvedValue(account);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useAccount('guid'));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'accounts', { guid: 'guid' }],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(Account.findOneBy).toBeCalledWith({ guid: 'guid' });
  });
});

describe('useAccounts', () => {
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    account1 = {
      guid: 'guid1',
    } as Account;
    account2 = {
      guid: 'guid2',
    } as Account;
    jest.spyOn(Account, 'find').mockResolvedValue([account1, account2]);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useAccounts());

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'accounts'],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(Account.find).toBeCalledWith();
  });
});
