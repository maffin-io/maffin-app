import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { DateTime } from 'luxon';

import { InvestmentAccount } from '@/book/models';
import { getInvestments } from '@/lib/queries/getInvestments';
import {
  Account,
  Commodity,
  Split,
} from '@/book/entities';
import { useInterval } from '@/hooks/state';
import fetcher from './fetcher';
import { useAccounts } from './useAccounts';
import { useMainCurrency } from './useMainCurrency';
import { useSplits } from './useSplits';

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
  const { data: interval } = useInterval();

  const { data: accounts, dataUpdatedAt: accountsUpdatedAt } = useAccounts();
  const { data: splits, dataUpdatedAt: splitsUpdatedAt } = useSplits({
    type: 'INVESTMENT',
    placeholder: false,
  });
  const { data: mainCurrency } = useMainCurrency();

  const queryKey = [
    ...InvestmentAccount.CACHE_KEY,
    {
      accountsUpdatedAt,
      splitsUpdatedAt,
    },
  ];
  const result = useQuery({
    queryKey,
    queryFn: fetcher(
      () => getInvestments(
        (accounts as Account[]).filter(a => a.type === 'INVESTMENT' && !a.placeholder),
        splits as Split[],
        mainCurrency as Commodity,
      ),
      queryKey,
    ),
    enabled: !!accounts && !!splits && !!mainCurrency,
    select: (data: TData) => {
      (data as InvestmentAccount[]).forEach(d => d.processSplits(interval.end as DateTime));

      if (select) {
        return select(data as InvestmentAccount[]);
      }

      return data;
    },
    networkMode: 'always',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}
