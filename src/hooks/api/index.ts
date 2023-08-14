import { DateTime } from 'luxon';
import { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { Commodity } from '@/book/entities';
import { PriceDB, PriceDBMap } from '@/book/prices';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries';
import getUser from '@/lib/getUser';
import useGapiClient from '@/hooks/useGapiClient';
import type { AccountsMap } from '@/types/book';
import type { Split, Transaction } from '@/book/entities';
import type { User } from '@/types/user';

export function useStartDate(): SWRResponse<DateTime> {
  const key = '/api/start-date';
  return useSWRImmutable(
    key,
    fetcher(queries.getEarliestDate, key),
  );
}

export function useMainCurrency(): SWRResponse<Commodity> {
  const key = '/api/main-currency';
  return useSWRImmutable(
    key,
    fetcher(queries.getMainCurrency, key),
  );
}

export function useCommodities(): SWRResponse<Commodity[]> {
  const key = '/api/commodities';
  return useSWRImmutable(
    key,
    fetcher(Commodity.find, key),
  );
}

export function useLatestTxs(): SWRResponse<Transaction[]> {
  const key = '/api/txs/latest';
  return useSWRImmutable(
    key,
    fetcher(queries.getLatestTxs, key),
  );
}

export function useAccounts(): SWRResponse<AccountsMap> {
  const key = '/api/accounts';
  return useSWRImmutable(
    key,
    fetcher(queries.getAccounts, key),
  );
}

export function useAccountsMonthlyTotals(): SWRResponse<queries.MonthlyTotals> {
  const { data: accounts } = useSWRImmutable(
    '/api/accounts',
    fetcher(queries.getAccounts, '/api/accounts'),
  );
  const { data: todayPrices } = useSWRImmutable(
    '/api/prices/today',
    fetcher(PriceDB.getTodayQuotes, '/api/prices/today'),
  );

  const key = '/api/accounts/monthly-totals';
  const result = useSWRImmutable(
    (accounts && todayPrices) ? key : null,
    fetcher(() => queries.getMonthlyTotals(accounts, todayPrices), key),
  );
  if (result.error) {
    throw result.error;
  }

  return result;
}

export function useInvestments(): SWRResponse<InvestmentAccount[]> {
  const key = '/api/investments';
  return useSWRImmutable(
    key,
    fetcher(queries.getInvestments, key),
  );
}

export function useSplits(guid: string): SWRResponse<Split[]> {
  const key = `/api/splits/${guid}`;
  return useSWRImmutable(
    key,
    fetcher(async () => queries.getSplits(guid), key),
  );
}

export function useTodayPrices(): SWRResponse<PriceDBMap> {
  const key = '/api/prices/today';
  return useSWRImmutable(
    key,
    fetcher(PriceDB.getTodayQuotes, key),
  );
}

export function useUser(): SWRResponse<User> {
  const [isGapiLoaded] = useGapiClient();
  const key = '/api/user';
  return useSWRImmutable(
    isGapiLoaded ? key : null,
    fetcher(getUser, key),
    {
      refreshInterval: 100000,
      revalidateOnMount: true,
    },
  );
}

function fetcher(f: () => Promise<any>, key: string) {
  return async () => {
    const start = performance.now();
    const r = await f();
    const end = performance.now();
    console.log(`${key}: ${end - start}ms`);
    return r;
  };
}
