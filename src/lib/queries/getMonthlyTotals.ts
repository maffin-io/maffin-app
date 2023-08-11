import { Split } from '@/book/entities';

export type MonthlyTotals = {
  [guid: string]: {
    [yearMonth: string]: number,
  },
};

export default async function getMonthlyTotals(): Promise<MonthlyTotals> {
  const rows: { date: string, total: number, accountId: string }[] = await Split
    .query(`
      SELECT
        strftime('%m/%Y', tx.post_date) AS date,
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      GROUP BY 
        accountId, date
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const monthlyTotals: MonthlyTotals = {};
  rows.forEach(row => {
    if (!(row.accountId in monthlyTotals)) {
      monthlyTotals[row.accountId] = {};
    }

    monthlyTotals[row.accountId][row.date] = (
      monthlyTotals[row.accountId][row.date] || 0
    ) + row.total;
  });
  return monthlyTotals;
}
