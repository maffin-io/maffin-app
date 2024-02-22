import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  Transaction,
} from '@/book/entities';
import * as queries from '@/lib/queries';
import fetcher from './fetcher';

export { useAccount, useAccounts } from '@/hooks/api/useAccounts';
export { useCommodity, useCommodities } from '@/hooks/api/useCommodities';
export { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
export {
  useSplits,
  useSplitsPagination,
  useSplitsCount,
  useAccountTotal,
  useAccountsTotals,
  useAccountsMonthlyTotal,
  useAccountsMonthlyWorth,
} from '@/hooks/api/useSplits';
export { usePrices } from '@/hooks/api/usePrices';
export { useMainCurrency } from '@/hooks/api/useMainCurrency';

export function useStartDate(): UseQueryResult<DateTime> {
  return useQuery({
    queryKey: [...Transaction.CACHE_KEY, { name: 'start' }],
    queryFn: fetcher(queries.getEarliestDate, `/${Transaction.CACHE_KEY.join('/')}/start`),
  });
}

export function useLatestTxs(): UseQueryResult<Transaction[]> {
  return useQuery({
    queryKey: [...Transaction.CACHE_KEY, { name: 'latest' }],
    queryFn: fetcher(queries.getLatestTxs, `/${Transaction.CACHE_KEY.join('/')}/latest`),
  });
}
