import { DateTime, Interval } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { DefinedUseQueryResult } from '@tanstack/react-query';

/**
 * Controls the interval set by the user. If no interval selected,
 * it defaults to last 6 months.
 */
export function useInterval(): DefinedUseQueryResult<Interval> {
  const result = useQuery<Interval>({
    queryKey: ['state', 'interval'],
    queryFn: () => Interval.fromDateTimes(
      DateTime.now().minus({ months: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    ),
    initialData: Interval.fromDateTimes(
      DateTime.now().minus({ months: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    ),
    gcTime: Infinity,
    networkMode: 'always',
  });

  return result;
}
