import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { InvestmentAccount } from '@/book/models';
import { getInvestments } from '@/lib/queries/getInvestments';
import {
  Account,
  Commodity,
} from '@/book/entities';
import fetcher from './fetcher';
import { useAccounts } from './useAccounts';
import { useMainCurrency } from './useMainCurrency';

export function useInvestment(guid: string): UseQueryResult<InvestmentAccount | undefined> {
  const result = useInvestments<InvestmentAccount | undefined>(
    (data => data.find(a => a.account.guid === guid)),
  );

  return result;
}

/**
 * Returns all InvestmentAccount for accounts that are INVESTMENT. Note that
 * if there are changes to `/api/accounts/` or any of the other dependencies the
 * data here WILL NOT be refetched because we don't change the key.
 *
 * The data in this key is refreshed via the useInvestment hook as it updates for
 * each account that changes. This hook is only for the initial load.
 */
export function useInvestments<TData = InvestmentAccount[]>(
  select?: (data: InvestmentAccount[]) => TData,
): UseQueryResult<TData> {
  const { data: accounts } = useAccounts();
  const { data: mainCurrency } = useMainCurrency();

  const result = useQuery({
    queryKey: [...InvestmentAccount.CACHE_KEY],
    queryFn: fetcher(
      () => getInvestments(
        (accounts as Account[]).filter(a => a.type === 'INVESTMENT'),
        mainCurrency as Commodity,
      ),
      `/${InvestmentAccount.CACHE_KEY.join('/')}`,
    ),
    enabled: !!accounts && !!mainCurrency,
    select,
    networkMode: 'always',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}
