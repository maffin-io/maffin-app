import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useSplits } from '@/hooks/api';
import { Split } from '@/book/entities';
import * as queries from '@/lib/queries';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

describe('useSplits', () => {
  let split1: Split;
  let split2: Split;

  beforeEach(() => {
    split1 = {
      guid: 'guid1',
    } as Split;
    split2 = {
      guid: 'guid2',
    } as Split;
    jest.spyOn(queries, 'getSplits').mockResolvedValue([split1, split2]);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useSplits({ guid: 'guid' }));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'splits', { guid: 'guid' }],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getSplits).toBeCalledWith(
      { guid: 'guid' },
      {
        fk_transaction: {
          splits: {
            fk_account: true,
          },
        },
        fk_account: true,
      },
    );
  });
});
