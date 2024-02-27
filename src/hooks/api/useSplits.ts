import React from 'react';
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
import type { AccountsTotals } from '@/types/book';
import { aggregateChildrenTotals, aggregateMonthlyWorth } from '@/helpers/accountsTotalAggregations';
import monthlyDates from '@/helpers/monthlyDates';
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
  pagination: { pageSize: number, pageIndex: number } = { pageSize: 10, pageIndex: 0 },
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
  selectedDate: DateTime = DateTime.now(),
): UseQueryResult<number> {
  const queryKey = [...Split.CACHE_KEY, account, 'total', selectedDate.toISODate()];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => {
        const r = await Split.query(`
          SELECT
            SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total
          FROM splits
          JOIN transactions as tx ON splits.tx_guid = tx.guid
          WHERE splits.account_guid = :guid
            AND post_date <= '${selectedDate.toSQLDate()}'
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
 * by accumulating the splits for each account.
 *
 * By default, it aggregates the splits of the children into their parent but an
 * optional select parameter can be passed to change that behavior.
 */
export function useAccountsTotals(
  selectedDate: DateTime = DateTime.now(),
  select?: (data: AccountsTotals) => AccountsTotals,
): UseQueryResult<AccountsTotals> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals) => aggregateChildrenTotals(
      'type_root',
      accounts as Account[],
      prices as PriceDBMap,
      selectedDate,
      data,
    )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountsUpdatedAt, pricesUpdatedAt, selectedDate.toISODate()],
  );

  const queryKey = [
    ...Split.CACHE_KEY,
    {
      aggregation: 'total',
      date: selectedDate.toISODate(),
      accountsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => getAccountsTotals(
        accounts as Account[],
        selectedDate,
      ),
      queryKey,
    ),
    enabled: !!accounts,
    select: select || aggregate,
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
  interval?: Interval,
): UseQueryResult<AccountsTotals[]> {
  interval = interval || Interval.fromDateTimes(
    DateTime.now().minus({ month: 6 }).startOf('month'),
    DateTime.now(),
  );
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = monthlyDates(interval as Interval).map(d => d.endOf('month'));
      dates[dates.length - 1] = (interval as Interval).end as DateTime;
      return data.map((d, i) => aggregateChildrenTotals(
        'type_root',
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
      dates: interval.toISODate(),
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
  interval?: Interval,
): UseQueryResult<AccountsTotals[]> {
  interval = interval
    || Interval.fromDateTimes(
      DateTime.now().minus({ month: 6 }).startOf('month'),
      DateTime.now(),
    );
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});
  const { data: totals, dataUpdatedAt: totalsUpdatedAt } = useAccountsTotals(
    (interval.start as DateTime).endOf('month') as DateTime,
    (data) => data,
  );

  const aggregate = React.useCallback(
    ((data: AccountsTotals[]) => {
      const dates = monthlyDates(interval as Interval).map(d => d.endOf('month'));
      dates[dates.length - 1] = (interval as Interval).end as DateTime;
      const aggregated = aggregateMonthlyWorth(
        'type_root',
        accounts as Account[],
        [
          totals as AccountsTotals,
          ...data,
        ],
        dates,
      );
      return aggregated.map((d, i) => aggregateChildrenTotals(
        'type_root',
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
      dates: interval.toISODate(),
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
  });

  return result;
}
