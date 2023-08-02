import useSWRImmutable from 'swr/immutable';
import { Fetcher, SWRResponse, SWRConfiguration } from 'swr';

import { Commodity } from '@/book/entities';
import * as queries from '@/book/queries';
import { PriceDB } from '@/book/prices';
import getUser from '@/lib/getUser';

/**
 * Wrapper around SWR to make the usable keys explicit and re-usable
 */
export default function useApi(k: ApiPaths | null, args?: any): SWRResponse {
  let f = k !== null ? API[k].f : () => {};
  const swrArgs = k !== null ? API[k].swrArgs : undefined;

  let key: string | null = k;
  if (k === '/api/splits/<guid>') {
    key = k.replace('<guid>', args.guid);
    f = () => queries.getSplits(args.guid);
  }

  return useSWRImmutable(key, f, swrArgs);
}

export type ApiPaths = (
  '/api/start-date'
  | '/api/main-currency'
  | '/api/commodities'
  | '/api/accounts'
  | '/api/accounts/splits'
  | '/api/investments'
  | '/api/prices/today'
  | '/api/splits/<guid>'
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
    f: queries.getAccountsWithPath,
  },
  '/api/accounts/splits': {
    f: () => queries.getAccountsWithPath({
      relations: { splits: { fk_transaction: true } },
      showRoot: true,
    }),
  },
  '/api/investments': {
    f: queries.getInvestments,
  },
  '/api/prices/today': {
    f: PriceDB.getTodayQuotes,
  },
  '/api/splits/<guid>': {
    f: queries.getSplits,
  },
  '/api/user': {
    f: getUser,
    swrArgs: {
      refreshInterval: 100000,
      revalidateOnMount: true,
    },
  },
};
