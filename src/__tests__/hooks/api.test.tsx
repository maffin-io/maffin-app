import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { Commodity } from '@/book/entities';
import * as API from '@/hooks/api';
import * as queries from '@/lib/queries';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

jest.mock('@/book/prices', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/prices'),
}));

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

describe('API', () => {
  beforeEach(() => {
    jest.spyOn(Commodity, 'findOneByOrFail').mockImplementation();
    jest.spyOn(Commodity, 'find').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useStartDate', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.useStartDate());

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['api', 'txs', { name: 'start' }],
        queryFn: expect.any(Function),
        networkMode: 'always',
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getEarliestDate).toBeCalled();
    });
  });

  describe('useLatestTxs', () => {
    it('calls query as expected', async () => {
      renderHook(() => API.useLatestTxs());

      expect(query.useQuery).toBeCalledWith({
        queryKey: ['api', 'txs', { name: 'latest' }],
        queryFn: expect.any(Function),
        networkMode: 'always',
      });

      const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
      callArgs.queryFn();
      expect(queries.getLatestTxs).toBeCalled();
    });
  });
});
