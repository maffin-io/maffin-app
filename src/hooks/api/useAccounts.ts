import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { getAccounts, getAccount } from '@/lib/queries';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import fetcher from './fetcher';

const KEY = '/api/accounts';

export function useAccount(guid: string): UseQueryResult<Account> {
  const result = useQuery({
    queryKey: [KEY, { guid }],
    queryFn: fetcher(() => getAccount(guid), `${KEY}/${guid}`),
  });

  return result;
}

export function useAccounts(): UseQueryResult<AccountsMap> {
  const result = useQuery({
    queryKey: [KEY],
    queryFn: fetcher(() => getAccounts(), KEY),
  });

  return result;
}
