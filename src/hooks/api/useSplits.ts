import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import type { FindOptionsWhere } from 'typeorm';
import { DateTime, Interval } from 'luxon';

import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import { getAccountsTotals, getMonthlyTotals } from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import type { AccountsMonthlyTotals, AccountsTotals } from '@/types/book';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
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
  const queryKey = [...Split.CACHE_KEY, findOptions.guid, findOptions];
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
  });

  return result;
}

/**
 * This query is specialised to be used on listing transactions for a given account.
 * It returns the list of splits with the balance field populated
 */
export function useSplitsPagination(
  account: string,
  pagination: { pageSize: number, pageIndex: number },
): UseQueryResult<Split[]> {
  const queryKey = [...Split.CACHE_KEY, account, 'page', pagination];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => Split.getRepository().createQueryBuilder('splits')
        .select([
          'splits',
          'tx.date',
          'tx.guid',
          'SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) OVER (ORDER BY tx.post_date, tx.enter_date) AS splits_balance',
        ])
        .leftJoin('splits.fk_transaction', 'tx', 'splits.tx_guid = tx.guid')
        .where('splits.account_guid = :account_guid', { account_guid: account })
        .orderBy('tx.post_date', 'DESC')
        .addOrderBy('tx.enter_date', 'DESC')
        .addOrderBy('splits.quantity_num', 'ASC')
        .limit(pagination.pageSize)
        .offset(pagination.pageSize * pagination.pageIndex)
        .getMany(),
      queryKey,
    ),
  });

  return result;
}

/**
 * Returns the count of splits for a given account
 */
export function useSplitsCount(
  account: string,
): UseQueryResult<number> {
  const queryKey = [...Split.CACHE_KEY, account, 'count'];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => Split.count({ where: { fk_account: { guid: account } } }),
      queryKey,
    ),
  });

  return result;
}

/**
 * Calculates total sum of split quantities for a given account
 */
export function useAccountTotal(
  account: string,
): UseQueryResult<number> {
  const queryKey = [...Split.CACHE_KEY, account, 'total'];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => {
        const r = await Split.query(`
          SELECT
            SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total
          FROM splits
          WHERE splits.account_guid = :guid
        `, [account]);
        return r[0].total;
      },
      queryKey,
    ),
  });

  return result;
}

/**
 * Calculates the total for each existing account. The total is calculated
 * by accumulating the splits for each account plus the total of their children
 *
 * If a child has different currency (for asset or liability accounts) the price
 * is converted using the latest available matching exchange rate.
 */
export function useAccountsTotal(
  selectedDate: DateTime = DateTime.now(),
): UseQueryResult<AccountsTotals> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'total',
      date: selectedDate.toISODate(),
      accountsUpdatedAt,
      pricesUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => getAccountsTotals(
        accounts as Account[],
        prices as PriceDBMap,
        selectedDate,
      ),
      queryKey,
    ),
    enabled: !!accounts && !!prices,
  });

  return result;
}

export function useAccountsMonthlyTotal(
  interval?: Interval,
): UseQueryResult<AccountsMonthlyTotals> {
  interval = interval || Interval.fromDateTimes(
    DateTime.now().minus({ month: 6 }).startOf('month'),
    DateTime.now(),
  );
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'monthly-total',
      dates: interval.toISODate(),
      accountsUpdatedAt,
      pricesUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        prices as PriceDBMap,
        interval,
      ),
      queryKey,
    ),
    enabled: !!accounts && !!prices,
  });

  return result;
}
