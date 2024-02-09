import { mutate } from 'swr';
import { renderHook, waitFor } from '@testing-library/react';

import { useAccount, useAccounts } from '@/hooks/api';
import * as queries from '@/lib/queries';
import type { Account } from '@/book/entities';
import {AccountsMap} from '@/types/book';

jest.mock('@/lib/queries');

describe('useAccount', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid',
    } as Account;
    jest.spyOn(queries, 'getAccount').mockResolvedValue(account);
    mutate('/api/accounts', undefined);
    mutate('/api/accounts/guid', undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns account', async () => {
    const { result } = renderHook(() => useAccount('guid'));

    await waitFor(() => expect(result.current.data).toEqual(account));
  });

  it('calls query only once', async () => {
    const { result, rerender } = renderHook(() => useAccount('guid'));

    rerender('guid');

    await waitFor(() => expect(result.current.data).toEqual(account));
    expect(queries.getAccount).toBeCalledTimes(1);
  });

  /**
   * When useAccounts has not been called yet, we leave it's data as
   * undefined as it's the only way to make sure to trigger the fetcher
   * for it.
   */
  it('useAccounts is triggered when no data', async () => {
    jest.spyOn(queries, 'getAccounts').mockResolvedValue({ [account.guid]: account });
    const { result: r } = renderHook(() => useAccount('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(account));

    const { result } = renderHook(() => useAccounts());

    expect(queries.getAccounts).toBeCalledTimes(1);
    await waitFor(() => expect(result.current.data).toEqual({ [account.guid]: account }));
  });

  /**
   * When adding a new account account, if we modify
   * the /api/accounts/guid key, we want it also to append this new account
   * to the general /api/accounts
   */
  it('appends account when it doesnt exist in /api/accounts', async () => {
    const existingAccount = { guid: '1' };
    mutate('/api/accounts', { [existingAccount.guid]: existingAccount });
    const { result: r } = renderHook(() => useAccount('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(account));

    const { result } = renderHook(() => useAccounts());

    expect(queries.getAccounts).toBeCalledTimes(0);
    await waitFor(() => expect(result.current.data).toEqual({
      [account.guid]: account,
      [existingAccount.guid]: existingAccount,
    }));
  });

  /**
   * When updating an account account, we want to make sure that there is
   * consistency in /api/accounts so we replace the already existing one
   * with the updated one
   */
  it('replaces account when existing in /api/accounts', async () => {
    const previousAccount = { guid: 'guid', type: 'ASSET' };
    mutate('/api/accounts', { [previousAccount.guid]: previousAccount });
    const { result: r } = renderHook(() => useAccount('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(account));

    const { result } = renderHook(() => useAccounts());

    expect(queries.getAccounts).toBeCalledTimes(0);
    await waitFor(() => expect(result.current.data).toEqual({ [account.guid]: account }));
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
    mutate('/api/accounts', undefined);
    mutate('/api/account/guid', undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns accounts', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => expect(result.current.data).toEqual(accountsMap));
  });

  it('calls query only once', async () => {
    const { result, rerender } = renderHook(() => useAccounts());

    rerender('guid');

    await waitFor(() => expect(result.current.data).toEqual(accountsMap));
    expect(queries.getAccounts).toBeCalledTimes(1);
  });

  it('populates individual keys', async () => {
    const { result } = renderHook(() => useAccounts());

    // wait for the hook to populate the data
    await waitFor(() => expect(result.current.data).toEqual(accountsMap));

    const { result: r1 } = renderHook(() => useAccount('guid1'));
    const { result: r2 } = renderHook(() => useAccount('guid2'));

    expect(queries.getAccount).toBeCalledTimes(0);
    await waitFor(() => expect(r1.current.data).toEqual(account1));
    await waitFor(() => expect(r2.current.data).toEqual(account2));
  });
});
