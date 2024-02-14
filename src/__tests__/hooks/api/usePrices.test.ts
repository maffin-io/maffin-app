import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { usePrices } from '@/hooks/api';
import * as queries from '@/lib/queries';
import type { Commodity } from '@/book/entities';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

describe('usePrices', () => {
  it('calls query as expected', async () => {
    renderHook(() => usePrices({ guid: 'guid' } as Commodity));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['/api/prices', { commodity: 'guid' }],
      queryFn: expect.any(Function),
      enabled: true,
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getPrices).toBeCalledWith({ from: { guid: 'guid' } });
  });
});
