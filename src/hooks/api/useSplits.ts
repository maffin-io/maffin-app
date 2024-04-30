import { useQuery } from '@tanstack/react-query';
import { Between, FindOptionsWhere, Like } from 'typeorm';
import type { UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
import { useInterval } from '@/hooks/state';
import type { Account } from '@/book/entities';
import fetcher from './fetcher';

/**
 * This query is a generic way to retrieve splits. It's quite unoptimised because
 * it is used by useInvestment/s queries and they need A LOT of nested information
 * like full transation with all splits, the account, etc. We probably should separate
 * in two queries in the future.
 */
export function useSplits(
  findOptions: FindOptionsWhere<Account>,
): UseQueryResult<Split[]> {
  const queryKey = [...Split.CACHE_KEY, findOptions];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => Split.find({
        where: {
          fk_account: {
            ...findOptions,
          },
        },
        relations: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
        order: {
          fk_transaction: {
            date: 'DESC',
            enterDate: 'DESC',
          },
          // This is so debit is always before credit
          // so we avoid negative amounts when display
          // partial totals
          quantityNum: 'ASC',
        },
      }),
      queryKey,
    ),
    networkMode: 'always',
  });

  return result;
}

/**
 * This query is specialised to be used on listing transactions for a given account.
 * It returns the list of splits with the balance field populated
 */
export function useSplitsPagination(
  account: string,
  pagination: { pageSize: number, pageIndex: number } = { pageSize: 10, pageIndex: 0 },
  search = '',
): UseQueryResult<Split[]> {
  const { data: interval } = useInterval();

  const queryKey = [
    ...Split.CACHE_KEY,
    account,
    'page',
    { ...pagination, search, interval: interval.toISODate() },
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
          .andWhere('tx.description LIKE :search', { search: `%${search}%` })
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
  search = '',
): UseQueryResult<number> {
  const { data: interval } = useInterval();

  const queryKey = [
    ...Split.CACHE_KEY,
    account,
    'count',
    { search, interval: interval.toISODate() },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => Split.count({
        where: {
          fk_account: { guid: account },
          fk_transaction: {
            date: Between(interval.start, interval.end),
            description: Like(`%${search}%`),
          },
        },
      }),
      queryKey,
    ),
    networkMode: 'always',
  });

  return result;
}
