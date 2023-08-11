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
  let apiKey = key;
  if (key?.startsWith('/api/splits/')) {
    apiKey = '/api/splits/<guid>';
  }
  const f = apiKey !== null ? API[apiKey].f : () => {};
  const swrArgs = apiKey !== null ? API[apiKey].swrArgs : undefined;

  const result = useSWRImmutable(key, f, swrArgs);

  if (result.error) {
    throw result.error;
  }

  return result;
}

export type ApiPaths = (
  '/api/start-date'
  | '/api/main-currency'
  | '/api/commodities'
  | '/api/txs/latest'

  | '/api/accounts'
  | '/api/accounts/monthly-totals'
  | '/api/accounts/tree'

  | `/api/splits/${string}`
  | '/api/investments'

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
    f: async (k: string) => {
      const start = performance.now();
      const r = await Commodity.find();
      const end = performance.now();
      console.log(`${k}: ${end - start}ms`);
      return r;
    },
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
  '/api/accounts/monthly-totals': {
    f: async (k: string) => {
      const start = performance.now();
      const r = await queries.getMonthlyTotals();
      const end = performance.now();
      console.log(`${k}: ${end - start}ms`);
      return r;
    },
  },
  '/api/accounts/tree': {
    f: async (k: string) => {
      const start = performance.now();
      const r = await queries.getAccounts();
      const end = performance.now();
      console.log(`${k}: ${end - start}ms`);
      return r;
    },
  },
  '/api/splits/<guid>': {
    f: async (k: string) => {
      const start = performance.now();
      const accountGuid = k.split('/').at(-1) || '';
      const r = await queries.getSplits(accountGuid);
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
