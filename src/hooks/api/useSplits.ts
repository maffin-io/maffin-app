import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import type { FindOptionsWhere } from 'typeorm';

import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import { getSplits } from '@/lib/queries';
import fetcher from './fetcher';

/**
 * This query is mainly used for when we want to retrieve splits for a specific account
 * so we display them
 */
export function useSplits(findOptions: FindOptionsWhere<Account>): UseQueryResult<Split[]> {
  return useQuery({
    queryKey: [...Split.CACHE_KEY, findOptions],
    queryFn: fetcher(
      () => getSplits(
        findOptions,
        {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
      ),
      `/${Split.CACHE_KEY.join('/')}/${JSON.stringify(findOptions)}`,
    ),
  });
}
