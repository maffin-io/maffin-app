import useSWRImmutable from 'swr/immutable';
import { Fetcher, SWRResponse, SWRConfiguration } from 'swr';

import { Commodity } from '@/book/entities';
import * as queries from '@/lib/queries';
import { PriceDB } from '@/book/prices';
import getUser from '@/lib/getUser';

/**
 * Wrapper around SWR to make the usable keys explicit and re-usable
 */
export default function useApi(key: ApiPaths | null): SWRResponse {
  const f = key !== null ? API[key].f : () => {};
  const swrArgs = key !== null ? API[key].swrArgs : undefined;

  return useSWRImmutable(key, f, swrArgs);
}

export type ApiPaths = (
  '/api/start-date'
  | '/api/main-currency'
  | '/api/commodities'
  | '/api/accounts'
  | '/api/investments'
  | '/api/txs/latest'
  | '/api/prices/today'
  | '/api/user'
);

const API: {
  [key in ApiPaths]: {
    f: Fetcher,
    swrArgs?: SWRConfiguration,
  };
} = {
  '/api/start-date': {
    f: queries.getEarliestDate,
  },
  '/api/main-currency': {
    f: queries.getMainCurrency,
  },
  '/api/commodities': {
    f: Commodity.find,
  },
  '/api/accounts': {
    f: async (k: string) => {
      const start = performance.now();
      const r = await queries.getAccounts();
      const end = performance.now();
      console.log(`${k}: ${end - start}ms`);
      return r;
    },
  },
  '/api/investments': {
    f: queries.getInvestments,
  },
  '/api/prices/today': {
    f: PriceDB.getTodayQuotes,
  },
  '/api/txs/latest': {
    f: queries.getLatestTxs,
  },
  '/api/user': {
    f: getUser,
    swrArgs: {
      refreshInterval: 100000,
      revalidateOnMount: true,
    },
  },
};
