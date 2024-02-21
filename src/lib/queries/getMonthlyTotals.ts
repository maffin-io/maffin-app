import { DateTime, Interval } from 'luxon';

import { Split } from '@/book/entities';
import Money from '@/book/Money';
import mapAccounts from '@/helpers/mapAccounts';
import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import getEarliestDate from './getEarliestDate';

export type MonthlyTotals = {
  [guid: string]: {
    [yearMonth: string]: Money,
  },
};

/**
 * Given an interval it aggregates monthly splits for each account
 */
export default async function getMonthlyTotals(
  accounts: Account[],
  interval?: Interval,
): Promise<AccountsTotals[]> {
  interval = interval
    || Interval.fromDateTimes(await getEarliestDate(), DateTime.now());

  const rows: { date: string, total: number, accountId: string }[] = await Split
    .query(`
      SELECT
        strftime('%Y-%m', tx.post_date) AS date,
        ABS(SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom)) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      JOIN accounts as account ON splits.account_guid = account.guid
      WHERE tx.post_date >= '${interval.start?.toSQLDate()}'
        AND tx.post_date <= '${interval.end?.toSQLDate()}'
      GROUP BY 
        accountId, date
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
      ORDER BY tx.post_date
    `);

  const accountsMap = mapAccounts(accounts);

  const monthlyTotals: AccountsTotals[] = [];
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).startOf('month'));

  dates.forEach(date => {
    const totals: { [guid: string]: Money } = {};
    rows.filter(r => r.date === date.toFormat('yyyy-MM')).forEach(row => {
      totals[row.accountId] = new Money(row.total, accountsMap[row.accountId].commodity.mnemonic);
    });
    monthlyTotals.push(totals);
  });

  return monthlyTotals;
}
