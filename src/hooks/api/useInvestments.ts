import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import { InvestmentAccount } from '@/book/models';
import { getInvestments, initInvestment } from '@/lib/queries/getInvestments';
import {
  Account,
  Commodity,
  Split,
} from '@/book/entities';
import fetcher from './fetcher';
import { useAccount, useAccounts } from './useAccounts';
import { useSplits } from './useSplits';
import { useMainCurrency } from './useMainCurrency';

/**
 * This hook creates an Investment account for a given account. It depends on other
 * data like:
 *
 * - The specific account
 * - The splits for that account
 * - The main currency
 *
 * When all those dependencies are loaded, the investment is created and set under a key
 * containing the guid of the account and a variable number that accumulates data it
 * depends on so it gets updated when it changes.
 *
 * Other than creating the investment, it also modifies the list key /api/investments
 * so it updates with the added/updated investment.
 */
export function useInvestment(guid: string): UseQueryResult<InvestmentAccount> {
  const queryClient = useQueryClient();
  const { data: account, dataUpdatedAt: accountUpdatedAt } = useAccount(guid);
  const { data: splits, dataUpdatedAt: splitsUpdatedAt } = useSplits({ guid });
  const { data: mainCurrency, dataUpdatedAt: currencyUpdatedAt } = useMainCurrency();

  const result = useQuery({
    queryKey: [
      ...InvestmentAccount.CACHE_KEY,
      {
        account: guid,
        accountUpdatedAt,
        splitsUpdatedAt,
        currencyUpdatedAt,
      },
    ],
    queryFn: fetcher(
      async () => {
        const investment = await initInvestment(
          account as Account,
          mainCurrency as Commodity,
          splits as Split[],
        );
        queryClient.setQueryData(
          [...InvestmentAccount.CACHE_KEY],
          (entities: InvestmentAccount[]) => {
            if (!entities) {
              return undefined;
            }

            const newEntities = [...entities];

            const index = entities.findIndex(e => e.account.guid === investment.account.guid);
            if (index === -1) { // New entity added
              newEntities.push(investment);
            } else { // Entity updated
              newEntities[index] = investment;
            }

            return newEntities;
          },
        );

        return investment;
      },
      `/${InvestmentAccount.CACHE_KEY.join('/')}/${guid}`,
    ),
    enabled: !!account && !!splits && !!mainCurrency,
    placeholderData: keepPreviousData,
  });

  if (result.error) {
    throw result.error;
  }
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
export function useInvestments(): UseQueryResult<InvestmentAccount[]> {
  const { data: accounts } = useAccounts();
  const { data: mainCurrency } = useMainCurrency();
  const { data: splits } = useSplits({ type: 'INVESTMENT' });

  const result = useQuery({
    queryKey: [...InvestmentAccount.CACHE_KEY],
    queryFn: fetcher(
      () => getInvestments(
        (accounts as Account[]).filter(a => a.type === 'INVESTMENT'),
        mainCurrency as Commodity,
        splits as Split[],
      ),
      `/${InvestmentAccount.CACHE_KEY.join('/')}`,
    ),
    enabled: !!accounts && !!splits && !!mainCurrency,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}
