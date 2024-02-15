import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { Account } from '@/book/entities';
import fetcher from './fetcher';

export function useAccount(guid: string): UseQueryResult<Account> {
  const result = useQuery({
    queryKey: [...Account.CACHE_KEY, { guid }],
    queryFn: fetcher(() => Account.findOneBy({ guid }), `/${Account.CACHE_KEY.join('/')}/${guid}`),
  });

  return result;
}

export function useAccounts(): UseQueryResult<Account[]> {
  const result = useQuery({
    queryKey: [...Account.CACHE_KEY],
    queryFn: fetcher(() => Account.find(), `/${Account.CACHE_KEY.join('/')}`),
  });

  return result;
}
