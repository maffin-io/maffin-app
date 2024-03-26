import { DateTime, Interval } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { Split } from '@/book/entities';
import { useInterval } from '@/hooks/state';
import Money from '@/book/Money';
import fetcher from './fetcher';

export type CashFlowRow = {
  guid: string,
  total: Money,
  type: string,
  name: string,
};

/**
 * Retrieve the cashflow for a given account in the specified period.
 *
 * The query works for transactions in multiple splits and in different currencies.
 * We do that by calculating the exchange rate in the transaction and applying it to
 * the splits for the other accounts.
 */
export function useCashFlow(
  account: string,
  selectedInterval?: Interval,
): UseQueryResult<CashFlowRow[]> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const queryKey = [...Split.CACHE_KEY, account, 'cashflow', interval.toISODate()];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      async () => {
        const rows = await Split.query(`
          SELECT
            splits.account_guid as guid,
            accounts.name as name,
            accounts.account_type as type,
            (
              SELECT commodities.mnemonic
              FROM commodities
              JOIN accounts AS main_account ON main_account.guid = '${account}'
              WHERE commodities.guid = main_account.commodity_guid
            ) AS mnemonic,
            SUM(((cast(main_split.quantity_num as REAL) / main_split.quantity_denom) / (cast(main_split.value_num as REAL) / main_split.value_denom)) * (cast(splits.value_num as REAL) / splits.value_denom)) as total

          FROM transactions AS tx
          JOIN splits ON splits.tx_guid = tx.guid
          JOIN accounts ON splits.account_guid = accounts.guid
          JOIN splits AS main_split ON main_split.tx_guid = tx.guid AND main_split.account_guid = '${account}'

          WHERE tx.guid IN (
            SELECT DISTINCT tx_guid
            FROM splits
            WHERE account_guid = '${account}'
          )
          AND accounts.guid != '${account}'
          AND tx.post_date BETWEEN '${((interval as Interval).start as DateTime).toSQLDate()}' AND '${((interval as Interval).end as DateTime).toSQLDate()}'

          GROUP BY splits.account_guid, accounts.name, accounts.account_type, mnemonic
        `) as { guid: string, type: string, name: string, total: number, mnemonic: string }[];

        return rows.map(r => ({
          guid: r.guid,
          type: r.type,
          name: r.name,
          total: new Money(r.total, r.mnemonic),
        }));
      },
      queryKey,
    ),
    networkMode: 'always',
  });

  return result;
}
