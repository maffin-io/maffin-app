import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Interval } from 'luxon';
import {
  DefinedUseQueryResult,
  QueryClientProvider,
} from '@tanstack/react-query';

import { useTransactionsReport } from '@/hooks/api';
import { Transaction } from '@/book/entities';
import * as stateHooks from '@/hooks/state';
import * as queries from '@/lib/queries';

jest.mock('@/lib/queries');

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useTransactionsReport', () => {
  beforeEach(() => {
    jest.spyOn(queries, 'getTransactionsReport').mockResolvedValue([]);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('calls query as expected', async () => {
    jest.spyOn(queries, 'getTransactionsReport').mockResolvedValue([
      { guid: 'tx1' } as Transaction,
    ]);

    const { result } = renderHook(
      () => useTransactionsReport(TEST_INTERVAL),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(result.current.data).toEqual([{ guid: 'tx1' }]);
    expect(queries.getTransactionsReport).toBeCalledWith(TEST_INTERVAL);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(
      [
        'api',
        'txs',
        {
          aggregation: 'transactions-report',
          interval: TEST_INTERVAL.toISODate(),
        },
      ],
    );
  });

  it('uses default interval when none selected', async () => {
    const { result } = renderHook(
      () => useTransactionsReport(),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(queries.getTransactionsReport).toBeCalledWith(TEST_INTERVAL);
  });
});
