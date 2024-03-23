import { DateTime, Interval } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
import { useInterval } from '@/hooks/state';

/**
 * Retrieve the cashflow for a given account in the specified date.
 *
 * Returns an array containing the account guid, the total for that account, the type and
 * the name.
 */
export function useCashFlow(
  account: string,
  selectedInterval?: Interval,
): UseQueryResult<{ guid: string, total: number, type: string, name: string }[]> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

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
