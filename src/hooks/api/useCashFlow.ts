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
            SUM(
              CASE
                WHEN splits.guid = credit_split.guid THEN
                  -1 * cast(account_split.quantity_num AS REAL) / account_split.quantity_denom
                ELSE
                  CASE
                    WHEN account_split.guid = credit_split.guid THEN
                      (cast(account_split.quantity_num AS REAL) / account_split.quantity_denom) / (cast(account_split.value_num AS REAL) / account_split.value_denom) * (cast(splits.value_num AS REAL) / splits.value_denom)
                    ELSE
                      0
                  END
              END
            ) AS total

          FROM transactions AS tx
          JOIN splits ON splits.tx_guid = tx.guid
          JOIN accounts ON splits.account_guid = accounts.guid
          JOIN splits AS account_split ON account_split.tx_guid = tx.guid AND account_split.account_guid = '${account}'
          JOIN splits AS credit_split ON credit_split.tx_guid = tx.guid AND credit_split.value_num < 0

          WHERE tx.guid IN (
            SELECT DISTINCT tx_guid
            FROM splits
            WHERE account_guid = '${account}'
          )
          AND accounts.guid != '${account}'
          AND tx.post_date BETWEEN '${((interval as Interval).start as DateTime).toSQLDate()}' AND '${((interval as Interval).end as DateTime).toSQLDate()}'

          GROUP BY splits.account_guid, accounts.name, accounts.account_type, mnemonic
          HAVING total != 0
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
