import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { usePrices } from '@/hooks/api';
import * as queries from '@/lib/queries';
import type { Commodity } from '@/book/entities';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

describe('usePrices', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => usePrices({ from: { guid: 'guid' } as Commodity }));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'guid' }],
      queryFn: expect.any(Function),
      enabled: true,
      networkMode: 'always',
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getPrices).toBeCalledWith({ from: { guid: 'guid' } });
  });

  it('calls query as expected with from and to', async () => {
    renderHook(() => usePrices({
      from: { guid: 'guid' } as Commodity,
      to: { guid: 'to' } as Commodity,
    }));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'prices', { from: 'guid', to: 'to' }],
      queryFn: expect.any(Function),
      enabled: true,
      networkMode: 'always',
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getPrices).toBeCalledWith({
      from: { guid: 'guid' },
      to: { guid: 'to' },
    });
  });

  /**
   * If we explicitly pass from and the value is undefined, it means the value
   * has not been loaded yet so we disable the query until it has a value
   */
  it('call is disabled if from passed with undefined', async () => {
    renderHook(() => usePrices({ from: undefined }));

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('call is disabled if to passed with undefined', async () => {
    renderHook(() => usePrices({ to: undefined }));

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });
});
