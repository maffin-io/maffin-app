import { Interval } from 'luxon';

import { Split } from '@/book/entities';
import Money from '@/book/Money';
import mapAccounts from '@/helpers/mapAccounts';
import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import { intervalToDates } from '@/helpers/dates';

/**
 * Given an interval it aggregates monthly splits for each account
 */
export default async function getMonthlyTotals(
  accounts: Account[],
  interval: Interval,
): Promise<AccountsTotals[]> {
  const rows: { date: string, total: number, accountId: string }[] = await Split
    .query(`
      SELECT
        strftime('%Y-%m', tx.post_date) AS date,
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      JOIN accounts as account ON splits.account_guid = account.guid
      WHERE tx.post_date >= '${interval.start?.toSQLDate()}'
        AND tx.post_date <= '${interval.end?.toSQLDate()}'
      GROUP BY 
        accountId, date
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const accountsMap = mapAccounts(accounts);

  const monthlyTotals: AccountsTotals[] = [];
  const dates = intervalToDates(interval);

  dates.forEach(date => {
    const totals: { [guid: string]: Money } = {};
    rows.filter(r => r.date === date.toFormat('yyyy-MM')).forEach(row => {
      const account = accountsMap[row.accountId];
      totals[row.accountId] = new Money(
        ['INCOME', 'EQUITY'].includes(account.type) ? Math.abs(row.total) : row.total,
        account.commodity.mnemonic,
      );
    });
    monthlyTotals.push(totals);
  });

  return monthlyTotals;
}
