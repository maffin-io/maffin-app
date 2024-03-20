import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DateTime, Interval } from 'luxon';

import { useInterval } from '@/hooks/state';

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useMainCurrency', () => {
  beforeEach(() => {
    queryClient.removeQueries();
  });

  it('sets now - 6 months as default', async () => {
    const { result } = renderHook(() => useInterval(), { wrapper });

    const expected = Interval.fromDateTimes(
      DateTime.now().minus({ month: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    );
    await waitFor(() => expect(result.current.data).toEqual(expected));

    /**
     * We are subtracting 6 months but this means we include 7 months in the range even though
     * it's only partially. Because our aggregations are monthly, we want to include all months
     * inside the range.
     */
    expect(result.current.data.splitBy({ month: 1 })).toHaveLength(7);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['state', 'interval']);
    expect(queryCache[0].gcTime).toEqual(Infinity);
  });
});
