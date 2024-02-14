import { DateTime } from 'luxon';
import { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  Transaction,
} from '@/book/entities';
import * as queries from '@/lib/queries';
import type { Account } from '@/book/entities';
import { useAccounts } from './useAccounts';
import fetcher from './fetcher';

export { useAccount, useAccounts } from '@/hooks/api/useAccounts';
export { useCommodity, useCommodities } from '@/hooks/api/useCommodities';
export { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
export { useSplits } from '@/hooks/api/useSplits';
export { usePrices } from '@/hooks/api/usePrices';
export { useMainCurrency } from '@/hooks/api/useMainCurrency';

export function useStartDate(): UseQueryResult<DateTime> {
  return useQuery({
    queryKey: [Transaction.CACHE_KEY, { name: 'start' }],
    queryFn: fetcher(queries.getEarliestDate, `${Transaction.CACHE_KEY}/start`),
  });
}

export function useLatestTxs(): UseQueryResult<Transaction[]> {
  return useQuery({
    queryKey: [Transaction.CACHE_KEY, { name: 'latest' }],
    queryFn: fetcher(queries.getLatestTxs, `${Transaction.CACHE_KEY}/latest`),
  });
}

export function useAccountsMonthlyTotals(): SWRResponse<queries.MonthlyTotals> {
  const { data: accounts } = useAccounts();
  const { data: prices } = useSWRImmutable(
    '/api/prices',
    fetcher(() => queries.getPrices({}), '/api/prices'),
  );

  const key = '/api/monthly-totals';
  const result = useSWRImmutable(
    (accounts && prices) ? key : null,
    fetcher(
      () => queries.getMonthlyTotals(accounts as Account[], prices),
      key,
    ),
  );

  return result;
}
