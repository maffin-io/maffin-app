import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Account, Commodity } from '@/book/entities';
import { getMainCurrency } from '@/lib/queries';
import fetcher from './fetcher';
import { useAccounts } from './useAccounts';

export function useMainCurrency(): UseQueryResult<Commodity> {
  const { data: assetAccount } = useAccounts<Account | undefined>(
    accounts => accounts.find(a => a.path === 'Assets'),
  );

  const queryKey = [...Commodity.CACHE_KEY, { guid: 'main' }];
  return useQuery({
    queryKey,
    queryFn: fetcher(getMainCurrency, queryKey),
    gcTime: Infinity,
    enabled: !!assetAccount,
    networkMode: 'always',
  });
}
