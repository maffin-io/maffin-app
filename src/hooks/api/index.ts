import { DateTime } from 'luxon';
import { mutate, SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';
import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { Commodity, Transaction } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import type { Account, Split } from '@/book/entities';
import { useAccounts } from './useAccounts';
import fetcher from './fetcher';

export { useAccount, useAccounts } from '@/hooks/api/useAccounts';
export { useCommodity, useCommodities } from '@/hooks/api/useCommodities';

export function useSplits(guid: string): SWRResponse<Split[]> {
  const key = `/api/splits/${guid}`;
  return useSWRImmutable(
    key,
    fetcher(async () => queries.getSplits(guid), key),
  );
}

export function useStartDate(): UseQueryResult<DateTime> {
  return useQuery({
    queryKey: [Transaction.CACHE_KEY, { name: 'start' }],
    queryFn: fetcher(queries.getEarliestDate, `${Transaction.CACHE_KEY}/start`),
  });
}

export function useMainCurrency(): UseQueryResult<Commodity> {
  return useQuery({
    queryKey: [Commodity.CACHE_KEY, { guid: 'main' }],
    queryFn: fetcher(queries.getMainCurrency, `${Commodity.CACHE_KEY}/main`),
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

export function useInvestment(guid: string): SWRResponse<InvestmentAccount> {
  const key = `/api/investments/${guid}`;

  const result = useSWRImmutable(
    key,
    fetcher(() => queries.getInvestment(guid), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

export function useInvestments(): SWRResponse<InvestmentAccount[]> {
  const key = '/api/investments';

  const result = useSWRImmutable(
    key,
    fetcher(() => queries.getInvestments(), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  if (result.data) {
    result.data.forEach(
      (investment: InvestmentAccount) => mutate(
        `/api/investments/${investment.account.guid}`,
        investment,
        { revalidate: false },
      ),
    );
  }

  return result;
}

/**
 * Returns prices for a given commodity
 */
export function usePrices(c: Commodity | undefined): SWRResponse<PriceDBMap> {
  const key = `/api/prices/${c?.guid}`;
  return useSWRImmutable(
    c?.guid ? key : null,
    fetcher(async () => queries.getPrices({ from: c }), key),
  );
}
