import { DateTime, Interval } from 'luxon';

/**
 * Given an interval, return an array of monthly dates that represent the points
 * where we want to retrieve data.
 *
 * For example, given a 2023-01-15/2023-03-15 interval, the returned dates would be:
 *  - 2023-01-31
 *  - 2023-02-28
 *  - 2023-03-15
 *
 * We don't return the start as a data point to keep an equal distribution of points
 * over time
 */
export function intervalToDates(i: Interval): DateTime[] {
  const interval = Interval.fromDateTimes(
    (i.start as DateTime).startOf('day'),
    (i.end as DateTime).endOf('day'),
  );
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).endOf('month'));

  if (dates[dates.length - 1].toMillis() > (interval.end as DateTime).toMillis()) {
    dates[dates.length - 1] = interval.end as DateTime;
  }

  return dates.map(d => d.startOf('day'));
}
