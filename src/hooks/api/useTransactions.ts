import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { Transaction } from '@/book/entities';
import fetcher from '@/hooks/api/fetcher';

export type UseTransactionProps<TData> = {
  guid: string,
  select?: (data: Transaction) => TData,
} & Omit<Partial<UseQueryOptions<Transaction>>, 'select'>;

export function useTransaction<TData = Transaction>({
  guid,
  select,
  ...props
}: UseTransactionProps<TData>): UseQueryResult<TData> {
  const queryKey = [...Transaction.CACHE_KEY, guid];
  return useQuery({
    ...props,
    queryKey,
    queryFn: fetcher(
      () => Transaction.findOne({
        where: { guid },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      }),
      queryKey,
    ),
    select,
    networkMode: 'always',
  });
}
