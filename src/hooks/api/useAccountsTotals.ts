import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { getMonthlyTotals } from '@/lib/queries';
import { Account } from '@/book/entities';
import type { MonthlyTotals } from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import { useAccounts } from './useAccounts';
import { usePrices } from './usePrices';
import fetcher from './fetcher';

/**
 * Returns monthly aggregations for all accounts that are. Note that
 * if there are changes to `/api/accounts/` or any of the other dependencies the
 * data here WILL NOT be refetched because we don't change the key.
 *
 * The data in this key is refreshed via the useAccountTotals hook as it updates for
 * each account that changes. This hook is only for the initial load.
 */
export function useAccountsTotals(): UseQueryResult<MonthlyTotals> {
  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: prices, dataUpdatedAt: pricesUpdatedAt } = usePrices({});

  const key = '/api/aggregations/accounts/totals';
  const result = useQuery({
    queryKey: [key, { accountsUpdatedAt, pricesUpdatedAt }],
    queryFn: fetcher(
      () => getMonthlyTotals(
        accounts as Account[],
        prices as PriceDBMap,
      ),
      key,
    ),
    enabled: !!accounts && !!prices,
  });

  return result;
}
