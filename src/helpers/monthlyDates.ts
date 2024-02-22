import { DateTime, Interval } from 'luxon';

/**
 * Given an interval, return an array of monthly dates at the start of the month.
 * For example, given a 2023-01-15/2023-03-15 interval, the returned dates would be:
 *  - 2023-01-01
 *  - 2023-02-01
 *  - 2023-03-01
 *
 * This function is mainly used in charts where you want to display monthly data
 */
export default function monthlyDates(interval: Interval): DateTime[] {
  const intervals: Interval[] = interval.splitBy({ month: 1 });
  return intervals.map(d => (d.start as DateTime).startOf('month'));
}
