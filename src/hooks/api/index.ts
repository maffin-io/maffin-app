import { DateTime } from 'luxon';
import { mutate, SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { Commodity } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries';
import type { PriceDBMap } from '@/book/prices';
import type { AccountsMap } from '@/types/book';
import type { Account, Split, Transaction } from '@/book/entities';

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

export function useCommodity(guid: string): SWRResponse<Commodity> {
  const key = `/api/commodities/${guid}`;

  const result = useSWRImmutable(
    key,
    fetcher(() => Commodity.findOneByOrFail({ guid }), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

export function useCommodities(): SWRResponse<Commodity[]> {
  const key = '/api/commodities';

  const result = useSWRImmutable(
    key,
    fetcher(() => Commodity.find(), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  if (result.data) {
    result.data.forEach(
      (commodity: Commodity) => mutate(
        `/api/commodities/${commodity.guid}`,
        commodity,
        { revalidate: false },
      ),
    );
  }

  return result;
}

export function useLatestTxs(): SWRResponse<Transaction[]> {
  const key = '/api/txs/latest';
  return useSWRImmutable(
    key,
    fetcher(queries.getLatestTxs, key),
  );
}

export function useAccount(guid: string): SWRResponse<Account> {
  const key = `/api/accounts/${guid}`;

  const result = useSWRImmutable(
    key,
    fetcher(() => queries.getAccounts(guid), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

export function useAccounts(): SWRResponse<AccountsMap> {
  const key = '/api/accounts';

  const result = useSWRImmutable(
    key,
    fetcher(() => queries.getAccounts(), key),
  );

  if (result.error) {
    throw new Error(result.error);
  }

  if (result.data) {
    Object.values(result.data as AccountsMap).forEach(
      (account: Account) => mutate(`/api/accounts/${account.guid}`, account, { revalidate: false }),
    );
  }

  return result;
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
      () => queries.getMonthlyTotals(accounts as AccountsMap, prices),
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

export function useSplits(guid: string): SWRResponse<Split[]> {
  const key = `/api/splits/${guid}`;
  return useSWRImmutable(
    key,
    fetcher(async () => queries.getSplits(guid), key),
  );
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

function fetcher(f: () => Promise<any>, key: string) {
  return async () => {
    const start = performance.now();
    const r = await f();
    const end = performance.now();
    console.log(`${key}: ${end - start}ms`);
    return r;
  };
}
