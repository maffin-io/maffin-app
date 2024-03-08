import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useMainCurrency } from '@/hooks/api';
import * as queries from '@/lib/queries';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

describe('useMainCurrency', () => {
  it('calls query as expected', async () => {
    renderHook(() => useMainCurrency());

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'commodities', { guid: 'main' }],
      queryFn: expect.any(Function),
      gcTime: Infinity,
      networkMode: 'always',
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getMainCurrency).toBeCalled();
  });
});
