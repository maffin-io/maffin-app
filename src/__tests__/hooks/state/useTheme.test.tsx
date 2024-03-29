import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { useTheme } from '@/hooks/state';

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useMainCurrency', () => {
  beforeEach(() => {
    localStorage.removeItem('theme');
    QUERY_CLIENT.removeQueries();
  });

  // We set dark theme as default in setupTests
  it('prefers system theme', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual('dark'));
    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['state', 'theme']);
    expect(queryCache[0].gcTime).toEqual(Infinity);
  });

  it('returns whatever is set in localstorage', async () => {
    localStorage.setItem('theme', 'light');

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual('light'));
    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].gcTime).toEqual(Infinity);
  });
});
