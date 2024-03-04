import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';

import { useAccount, useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAccounts', () => {
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    account1 = {
      guid: 'guid1',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['guid2'],
    } as Account;
    account2 = {
      guid: 'guid2',
      name: 'Assets',
      childrenIds: [] as string[],
      parentId: 'guid1',
    } as Account;
    jest.spyOn(Account, 'find').mockResolvedValue([account1, account2]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('calls query as expected', async () => {
    const { result } = renderHook(() => useAccounts(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Account.find).toBeCalledWith();
    expect(result.current.data).toEqual([account1, account2]);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'accounts']);
  });

  it('sets paths', async () => {
    jest.spyOn(Account, 'find').mockResolvedValue([
      account1,
      {
        ...account2,
        childrenIds: ['guid3'],
      } as Account,
      {
        guid: 'guid3',
        name: 'Bank',
        type: 'BANK',
        childrenIds: [] as string[],
        parentId: 'guid2',
      } as Account,
    ]);
    const { result } = renderHook(() => useAccounts(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data?.[0].path).toBe('Root');
    expect(result.current.data?.[1].path).toEqual('Assets');
    expect(result.current.data?.[2].path).toEqual('Assets:Bank');
  });
});

describe('useAccount', () => {
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    account1 = {
      guid: 'guid1',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['guid2'],
    } as Account;
    account2 = {
      guid: 'guid2',
      name: 'Assets',
      childrenIds: [] as string[],
      parentId: 'guid1',
    } as Account;
    jest.spyOn(Account, 'find').mockResolvedValue([account1, account2]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('calls query as expected', async () => {
    const { result } = renderHook(() => useAccount('guid1'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Account.find).toBeCalledWith();
    expect(result.current.data).toEqual(account1);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'accounts']);
  });

  it('returns undefined when account not found', async () => {
    const { result } = renderHook(() => useAccount('unknown'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Account.find).toBeCalledWith();
    expect(result.current.data).toEqual(undefined);
  });
});
