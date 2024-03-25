import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DateTime, Interval } from 'luxon';

import { useInterval } from '@/hooks/state';

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useMainCurrency', () => {
  beforeEach(() => {
    QUERY_CLIENT.removeQueries();
  });

  it('sets now - 6 months as default', async () => {
    const { result } = renderHook(() => useInterval(), { wrapper });

    const expected = Interval.fromDateTimes(
      DateTime.now().minus({ month: 5 }).startOf('month'),
      DateTime.now().endOf('day'),
    );
    await waitFor(() => expect(result.current.data).toEqual(expected));

    expect(result.current.data.splitBy({ month: 1 })).toHaveLength(6);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['state', 'interval']);
    expect(queryCache[0].gcTime).toEqual(Infinity);
  });
});
