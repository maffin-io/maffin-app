import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useCommodity, useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';

const queryClient = new QueryClient();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCommodities', () => {
  let commodity1: Commodity;
  let commodity2: Commodity;

  beforeEach(() => {
    commodity1 = {
      guid: 'guid1',
    } as Commodity;
    commodity2 = {
      guid: 'guid2',
    } as Commodity;
    jest.spyOn(Commodity, 'find').mockResolvedValue([commodity1, commodity2]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('calls query as expected', async () => {
    const { result } = renderHook(() => useCommodities(), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Commodity.find).toBeCalledWith();
    expect(result.current.data).toEqual([commodity1, commodity2]);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'commodities']);
  });
});

describe('useCommodity', () => {
  let commodity1: Commodity;
  let commodity2: Commodity;

  beforeEach(() => {
    commodity1 = {
      guid: 'guid1',
    } as Commodity;
    commodity2 = {
      guid: 'guid2',
    } as Commodity;
    jest.spyOn(Commodity, 'find').mockResolvedValue([commodity1, commodity2]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.removeQueries();
  });

  it('calls query as expected', async () => {
    const { result } = renderHook(() => useCommodity('guid1'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Commodity.find).toBeCalledWith();
    expect(result.current.data).toEqual(commodity1);

    const queryCache = queryClient.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'commodities']);
  });

  it('returns undefined when account not found', async () => {
    const { result } = renderHook(() => useCommodity('unknown'), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Commodity.find).toBeCalledWith();
    expect(result.current.data).toEqual(undefined);
  });
});
