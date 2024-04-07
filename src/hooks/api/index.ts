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
} from '@/hooks/api/useSplits';
export { useIncomeStatement } from '@/hooks/api/useIncomeStatement';
export { useBalanceSheet } from '@/hooks/api/useBalanceSheet';
export { useAccountsTotals } from '@/hooks/api/useAccountsTotals';
export { useMonthlyTotals } from '@/hooks/api/useMonthlyTotals';
export { useMonthlyWorth } from '@/hooks/api/useMonthlyWorth';
export { usePrices } from '@/hooks/api/usePrices';
export { useCashFlow } from '@/hooks/api/useCashFlow';
export { useMainCurrency } from '@/hooks/api/useMainCurrency';
export { useTransaction } from '@/hooks/api/useTransactions';

export function useStartDate(): UseQueryResult<DateTime> {
  return useQuery({
    queryKey: [...Transaction.CACHE_KEY, { name: 'start' }],
    queryFn: fetcher(queries.getEarliestDate, `/${Transaction.CACHE_KEY.join('/')}/start`),
    networkMode: 'always',
  });
}

export function useLatestTxs(): UseQueryResult<Transaction[]> {
  return useQuery({
    queryKey: [...Transaction.CACHE_KEY, { name: 'latest' }],
    queryFn: fetcher(queries.getLatestTxs, `/${Transaction.CACHE_KEY.join('/')}/latest`),
    networkMode: 'always',
  });
}
