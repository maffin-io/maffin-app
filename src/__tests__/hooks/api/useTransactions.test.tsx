import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { useTransaction } from '@/hooks/api';
import { Transaction } from '@/book/entities';

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('useTransaction', () => {
  let tx: Transaction;

  beforeEach(() => {
    tx = {
      guid: 'guid1',
    } as Transaction;
    jest.spyOn(Transaction, 'findOne').mockResolvedValue(tx);
  });

  afterEach(() => {
    jest.clearAllMocks();
    QUERY_CLIENT.removeQueries();
  });

  it('calls query as expected', async () => {
    const { result } = renderHook(() => useTransaction({ guid: 'guid1' }), { wrapper });

    await waitFor(() => expect(result.current.status).toEqual('success'));
    expect(Transaction.findOne).toBeCalledWith({
      relations: {
        splits: {
          fk_account: true,
        },
      },
      where: {
        guid: 'guid1',
      },
    });
    expect(result.current.data).toEqual(tx);

    const queryCache = QUERY_CLIENT.getQueryCache().getAll();
    expect(queryCache).toHaveLength(1);
    expect(queryCache[0].queryKey).toEqual(['api', 'txs', 'guid1']);
  });
});
