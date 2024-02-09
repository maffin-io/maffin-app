import {
  useQuery,
  UseQueryResult,
  QueryClient,
} from '@tanstack/react-query';

import { getAccounts, getAccount } from '@/lib/queries';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import fetcher from './fetcher';

export async function updateUI(
  {
    queryClient,
    account,
    isDelete = false,
  }: {
    queryClient: QueryClient,
    account: Account,
    isDelete?: boolean,
  },
) {
  await account.reload();
  const key = '/api/accounts';

  queryClient.setQueryData(
    [key],
    (accounts: AccountsMap | undefined) => {
      if (!accounts) {
        return undefined;
      }

      const parentAccount = accounts[account.parentId];
      const index = parentAccount.childrenIds.findIndex((guid: string) => guid === account.guid);
      if (!index) {
        parentAccount.childrenIds.push(account.guid);
      }
      if (isDelete) {
        delete parentAccount.childrenIds[index];
      }
      return {
        ...accounts,
        [account.guid]: !isDelete ? account : null,
        [account.parentId]: parentAccount,
      };
    },
  );

  queryClient.setQueryData(
    [key, { guid: account.guid }],
    !isDelete ? account : null,
  );
}

export function useAccount(guid: string): UseQueryResult<Account> {
  const key = '/api/accounts';
  const result = useQuery({
    queryKey: [key, { guid }],
    queryFn: fetcher(() => getAccount(guid), `${key}/${guid}`),
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

export function useAccounts(): UseQueryResult<AccountsMap> {
  const key = '/api/accounts';
  const result = useQuery({
    queryKey: [key],
    queryFn: fetcher(() => getAccounts(), key),
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}
