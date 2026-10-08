import { Interval } from 'luxon';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { useInterval } from '@/hooks/state';
import { Transaction } from '@/book/entities';
import { getTransactionsReport } from '@/lib/queries';
import fetcher from './fetcher';

/**
 * Returns income and expense transactions for a given interval.
 */
export function useTransactionsReport(
  selectedInterval?: Interval,
): UseQueryResult<Transaction[]> {
  const { data: defaultInterval } = useInterval();
  const interval = selectedInterval || defaultInterval;

  const queryKey = [
    ...Transaction.CACHE_KEY,
    {
      aggregation: 'transactions-report',
      interval: interval.toISODate(),
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getTransactionsReport(interval),
      queryKey,
    ),
    enabled: !!interval,
    networkMode: 'always',
  });

  return result;
}
