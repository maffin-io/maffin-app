import { Interval } from 'luxon';

import Money from '@/book/Money';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';
import type { AccountsTotals } from '@/types/book';

/**
 * Returns the sum of splits amounts for each account
 * for a given interval.
 *
 * For the case of accounts that are assets or
 * liabilities, we don't filter with the start date of the interval as
 * the total net worth depends on all the historical splits.
 */
export default async function getAccountsTotals(
  accounts: Account[],
  interval: Interval,
): Promise<AccountsTotals> {
  const rows: { total: number, accountId: string, mnemonic: string }[] = await Split
    .query(`
      SELECT
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      WHERE post_date <= '${interval.end?.toSQLDate()}'
      AND post_date >= '${interval.start?.toSQLDate()}'
      AND splits.account_guid IN ('${accounts.map(a => a.guid).join('\',\'')}')
      GROUP BY 
        accountId
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const accountsMap = mapAccounts(accounts);
  const totals: { [guid: string]: Money } = {};

  rows.forEach(row => {
    totals[row.accountId] = new Money(row.total, accountsMap[row.accountId].commodity.mnemonic);
  });

  return totals;
}
