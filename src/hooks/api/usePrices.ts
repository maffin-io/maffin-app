import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Price } from '@/book/entities';
import { getPrices } from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import type { Commodity } from '@/book/entities';
import fetcher from './fetcher';

/**
 * Returns prices for a given commodity
 */
export function usePrices(c: Commodity | undefined): UseQueryResult<PriceDBMap> {
  return useQuery({
    queryKey: [Price.CACHE_KEY, { commodity: c?.guid }],
    queryFn: fetcher(() => getPrices({ from: c }), `${Price.CACHE_KEY}/${c?.guid}`),
    enabled: !!c,
  });
}
