import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useAccount, useAccounts } from '@/hooks/api';
import * as queries from '@/lib/queries';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

jest.mock('@/lib/queries');

jest.mock('@tanstack/react-query');

describe('useAccount', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid',
    } as Account;
    jest.spyOn(queries, 'getAccount').mockResolvedValue(account);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useAccount('guid'));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['/api/accounts', { guid: 'guid' }],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getAccount).toBeCalledWith('guid');
  });
});

describe('useAccounts', () => {
  let accountsMap: AccountsMap;
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    account1 = {
      guid: 'guid1',
    } as Account;
    account2 = {
      guid: 'guid2',
    } as Account;
    accountsMap = {
      [account1.guid]: account1,
      [account2.guid]: account2,
    };
    jest.spyOn(queries, 'getAccounts').mockResolvedValue(accountsMap);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useAccounts());

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['/api/accounts'],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getAccounts).toBeCalledWith();
  });
});
