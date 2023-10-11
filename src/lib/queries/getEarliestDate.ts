import { DateTime } from 'luxon';

import { Transaction } from '@/book/entities';

/**
 * Retrieve the earliest date for the book. Returns start of this year if no transactions
 */
export default async function getEarliestDate(): Promise<DateTime> {
  const dates = await Transaction.query('SELECT MIN(post_date) as date FROM transactions;');
  return (
    dates.length && dates[0].date && DateTime.fromSQL(dates[0].date)
  ) || DateTime.now().startOf('year');
}
