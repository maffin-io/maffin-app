import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Commodity } from '@/book/entities';
import { getMainCurrency } from '@/lib/queries';
import fetcher from './fetcher';

export function useMainCurrency(): UseQueryResult<Commodity> {
  return useQuery({
    queryKey: [...Commodity.CACHE_KEY, { guid: 'main' }],
    queryFn: fetcher(getMainCurrency, `/${Commodity.CACHE_KEY.join('/')}/main`),
    gcTime: Infinity,
  });
}
