import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { Commodity } from '@/book/entities';
import fetcher from './fetcher';

export function useCommodity(guid: string): UseQueryResult<Commodity | undefined> {
  const result = useCommodities<Commodity | undefined>(
    (data => data.find(a => a.guid === guid)),
  );

  return result;
}

export function useCommodities<TData = Commodity[]>(
  select?: (data: Commodity[]) => TData,
): UseQueryResult<TData> {
  const result = useQuery({
    queryKey: [...Commodity.CACHE_KEY],
    queryFn: fetcher(() => Commodity.find(), Commodity.CACHE_KEY),
    select,
  });

  return result;
}
