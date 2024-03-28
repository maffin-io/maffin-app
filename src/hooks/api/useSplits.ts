import { useQuery } from '@tanstack/react-query';
import { Between } from 'typeorm';
import type { UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
import { useInterval } from '@/hooks/state';
import fetcher from './fetcher';

/**
 * This query is specialised to be used on listing transactions for a given account.
 * It returns the list of splits with the balance field populated
 */
export function useSplitsPagination(
  account: string,
  pagination: { pageSize: number, pageIndex: number } = { pageSize: 10, pageIndex: 0 },
): UseQueryResult<Split[]> {
  const { data: interval } = useInterval();

  const queryKey = [
    ...Split.CACHE_KEY,
    account,
    'page',
    { ...pagination, interval: interval.toISODate() },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => {
        const r = await Split.getRepository().createQueryBuilder('splits')
          .select('COALESCE(SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom), 0)', 'totalSum')
          .leftJoin('splits.fk_transaction', 'tx')
          .where('splits.account_guid = :account_guid', { account_guid: account })
          .andWhere('tx.post_date < :start', { start: interval.start?.toSQLDate() })
          .getRawOne();

        return Split.getRepository().createQueryBuilder('splits')
          .select([
            'splits',
            'tx.date',
            'tx.guid',
            `SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) OVER (ORDER BY tx.post_date, tx.enter_date) + ${r.totalSum} AS splits_balance`,
          ])
          .leftJoin('splits.fk_transaction', 'tx', 'splits.tx_guid = tx.guid')
          .where('splits.account_guid = :account_guid', { account_guid: account })
          .andWhere('tx.post_date >= :start', { start: interval.start?.toSQLDate() })
          .andWhere('tx.post_date <= :end', { end: interval.end?.toSQLDate() })
          .orderBy('tx.post_date', 'DESC')
          .addOrderBy('tx.enter_date', 'DESC')
          .addOrderBy('splits.quantity_num', 'ASC')
          .limit(pagination.pageSize)
          .offset(pagination.pageSize * pagination.pageIndex)
          .getMany();
      },
      queryKey,
    ),
    networkMode: 'always',
  });

  return result;
}

/**
 * Returns the count of splits for a given account
 */
export function useSplitsCount(
  account: string,
): UseQueryResult<number> {
  const { data: interval } = useInterval();

  const queryKey = [...Split.CACHE_KEY, account, 'count', { interval: interval.toISODate() }];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => Split.count({
        where: {
          fk_account: { guid: account },
          fk_transaction: {
            date: Between(interval.start, interval.end),
          },
        },
      }),
      queryKey,
    ),
    networkMode: 'always',
  });

  return result;
}
