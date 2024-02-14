import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useInvestment, useInvestments } from '@/hooks/api';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries';
import type { Account } from '@/book/entities';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries');

describe('useInvestment', () => {
  let investment: InvestmentAccount;

  beforeEach(() => {
    investment = {
      account: {
        guid: 'guid',
      } as Account,
    } as InvestmentAccount;
    // @ts-ignore
    jest.spyOn(queries, 'getInvestment').mockResolvedValue(investment);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useInvestment('guid'));

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['/api/investments', { guid: 'guid' }],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getInvestment).toBeCalledWith('guid');
  });
});

describe('useInvestments', () => {
  let investment1: InvestmentAccount;
  let investment2: InvestmentAccount;

  beforeEach(() => {
    investment1 = {
      account: {
        guid: 'guid1',
      } as Account,
    } as InvestmentAccount;
    investment2 = {
      account: {
        guid: 'guid2',
      } as Account,
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment1, investment2]);
    jest.spyOn(query, 'useQuery');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query as expected', async () => {
    renderHook(() => useInvestments());

    expect(query.useQuery).toBeCalledWith({
      queryKey: ['/api/investments'],
      queryFn: expect.any(Function),
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getInvestments).toBeCalledWith();
  });
});
