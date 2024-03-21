import React from 'react';
import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { Between, FindOptionsWhere } from 'typeorm';
import { DateTime, Interval } from 'luxon';

import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import { getMonthlyTotals } from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import type { AccountsTotals } from '@/types/book';
import { aggregateChildrenTotals, aggregateMonthlyWorth } from '@/helpers/accountsTotalAggregations';
import monthlyDates from '@/helpers/monthlyDates';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
import { useBalanceSheet } from './reports';
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
  interval: Interval,
  pagination: { pageSize: number, pageIndex: number } = { pageSize: 10, pageIndex: 0 },
): UseQueryResult<Split[]> {
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
  interval: Interval,
): UseQueryResult<number> {
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

/**
 * Aggregates monthly splits for each account to produce
 * monthly histograms of transactions. For accounts where their children
 * have different commodity, the monthly aggregation is converted using an
 * exchange rate for that month
 */
export function useAccountsMonthlyTotal(
  interval: Interval,
): UseQueryResult<AccountsTotals[]> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = monthlyDates(interval as Interval).map(d => d.endOf('month'));
      dates[dates.length - 1] = (interval as Interval).end as DateTime;
      return data.map((d, i) => aggregateChildrenTotals(
        ['type_income', 'type_expense'],
        accounts as Account[],
        prices as PriceDBMap,
        dates[i],
        d,
      ));
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, interval.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'monthly-total',
      interval: interval.toISODate(),
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        interval,
      ),
      queryKey,
    ),
    enabled: !!accounts,
    select: aggregate,
    networkMode: 'always',
  });

  return result;
}

/**
 * Aggregates monthly splits for each account accumulating the value for each month.
 * This is useful to produce monthly worth histograms.
 *
 * For accounts where their children
 * have different commodity, the monthly aggregation is converted using an
 * exchange rate for each respective month
 */
export function useAccountsMonthlyWorth(
  interval: Interval,
): UseQueryResult<AccountsTotals[]> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});
  const { data: totals, dataUpdatedAt: totalsUpdatedAt } = useBalanceSheet(
    interval.start?.endOf('month') as DateTime<true>,
    (data) => data,
  );

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = monthlyDates(interval as Interval).map(d => d.endOf('month'));
      dates[dates.length - 1] = (interval as Interval).end as DateTime;
      const aggregated = aggregateMonthlyWorth(
        ['type_asset', 'type_liability'],
        accounts as Account[],
        [
          totals as AccountsTotals,
          ...data,
        ],
        dates,
      );
      return aggregated.map((d, i) => aggregateChildrenTotals(
        ['type_asset', 'type_liability'],
        accounts as Account[],
        prices as PriceDBMap,
        dates[i],
        d,
      ));
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, totalsUpdatedAt, interval.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'monthly-worth',
      interval: interval.toISODate(),
      totalsUpdatedAt,
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        Interval.fromDateTimes(
          ((interval as Interval).start as DateTime).plus({ month: 1 }),
          (interval as Interval).end as DateTime,
        ),
      ),
      queryKey,
    ),
    enabled: !!accounts && !!totalsUpdatedAt,
    select: aggregate,
    networkMode: 'always',
  });

  return result;
}

/**
 * Retrieve the cashflow for a given account in the specified date.
 *
 * Returns an array containing the account guid, the total for that account, the type and
 * the name.
 */
export function useCashFlow(
  account: string,
  interval: Interval,
): UseQueryResult<{ guid: string, total: number, type: string, name: string }[]> {
  const result = useQuery({
    queryKey: [...Split.CACHE_KEY, account, 'cashflow', interval.toISODate()],
    queryFn: () => Split.query(`
      SELECT
        splits.account_guid as guid,
        accounts.name,
        accounts.account_type as type,
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total
      FROM transactions AS tx
      JOIN splits ON splits.tx_guid = tx.guid
      JOIN accounts ON splits.account_guid = accounts.guid
      WHERE tx.guid IN (
        SELECT DISTINCT tx_guid
        FROM splits
        WHERE account_guid = '${account}'
      )
      AND tx.post_date >= '${((interval as Interval).start as DateTime).toSQLDate()}'
      AND tx.post_date <= '${((interval as Interval).end as DateTime).toSQLDate()}'
      GROUP BY splits.account_guid
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
      ORDER BY total
    `),
    networkMode: 'always',
  }) as UseQueryResult<{ guid: string, total: number, type: string, name: string }[]>;

  return result;
}
