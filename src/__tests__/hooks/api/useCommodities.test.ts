import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useCommodity, useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';

jest.mock('@tanstack/react-query');

describe('useCommodity', () => {
  let commodity: Commodity;

  beforeEach(() => {
    commodity = {
      guid: 'guid',
    } as Commodity;
    // @ts-ignore
    jest.spyOn(Commodity, 'findOneBy').mockResolvedValue(commodity);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useCommodity('guid'));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'commodities', { guid: 'guid' }],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(Commodity.findOneBy).toBeCalledWith({ guid: 'guid' });
  });
});

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
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useCommodities());

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'commodities'],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(Commodity.find).toBeCalledWith();
  });
});
