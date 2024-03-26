import { DateTime } from 'luxon';
import type { Interval } from 'luxon';

import Money from '@/book/Money';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';
import type { AccountsTotals } from '@/types/book';

/**
 * Returns the sum of splits amounts for each account
 * up until the selected date
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
      WHERE tx.post_date BETWEEN '${((interval as Interval).start as DateTime).toSQLDate()}' AND '${((interval as Interval).end as DateTime).toSQLDate()}'
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
