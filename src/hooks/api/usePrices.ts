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
export function usePrices(params: {
  from?: Commodity,
  to?: Commodity,
}): UseQueryResult<PriceDBMap> {
  const queryKey = [...Price.CACHE_KEY, { from: params.from?.guid, to: params.to?.guid }];
  return useQuery({
    queryKey,
    queryFn: fetcher(
      () => getPrices(params),
      queryKey,
    ),
    enabled: (
      !!('from' in params && params.from)
      || !!('to' in params && params.to)
      || (!('from' in params) && !('to' in params))
    ),
  });
}
