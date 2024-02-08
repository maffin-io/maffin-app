import { mutate, SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { InvestmentAccount } from '@/book/models';
import { getInvestment, getInvestments } from '@/lib/queries';
import fetcher from './fetcher';

export function useInvestment(guid: string): SWRResponse<InvestmentAccount> {
  const key = `/api/investments/${guid}`;

  const result = useSWRImmutable(
    key,
    fetcher(() => getInvestment(guid), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  if (result.data) {
    mutate(
      '/api/investments',
      (investments: InvestmentAccount[] | undefined) => {
        if (!investments) {
          return [result.data];
        }

        const index = investments.findIndex(i => i.account.guid === result.data.account.guid);
        if (index === -1) {
          investments.push(result.data);
          return investments;
        }

        investments[index] = result.data;
        return investments;
      },
      { revalidate: false },
    );
  }

  return result;
}

export function useInvestments(): SWRResponse<InvestmentAccount[]> {
  const key = '/api/investments';

  const result = useSWRImmutable(
    key,
    fetcher(() => getInvestments(), key),
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
