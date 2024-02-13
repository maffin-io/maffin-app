import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { Commodity } from '@/book/entities';
import fetcher from './fetcher';

export function useCommodity(guid: string): UseQueryResult<Commodity> {
  const result = useQuery({
    queryKey: [Commodity.CACHE_KEY, { guid }],
    queryFn: fetcher(() => Commodity.findOneBy({ guid }), `${Commodity.CACHE_KEY}/${guid}`),
  });

  return result;
}

export function useCommodities(): UseQueryResult<Commodity[]> {
  const result = useQuery({
    queryKey: [Commodity.CACHE_KEY],
    queryFn: fetcher(() => Commodity.find(), Commodity.CACHE_KEY),
  });

  return result;
}
