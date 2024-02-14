import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { InvestmentAccount } from '@/book/models';
import { getInvestment, getInvestments } from '@/lib/queries';
import fetcher from './fetcher';

export function useInvestment(guid: string): UseQueryResult<InvestmentAccount> {
  const result = useQuery({
    queryKey: [InvestmentAccount.CACHE_KEY, { guid }],
    queryFn: fetcher(() => getInvestment(guid), `${InvestmentAccount.CACHE_KEY}/${guid}`),
  });

  return result;
}

export function useInvestments(): UseQueryResult<InvestmentAccount[]> {
  const result = useQuery({
    queryKey: [InvestmentAccount.CACHE_KEY],
    queryFn: fetcher(getInvestments, InvestmentAccount.CACHE_KEY),
  });

  return result;
}
