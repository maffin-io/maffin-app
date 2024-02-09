import { mutate } from 'swr';
import { renderHook, waitFor } from '@testing-library/react';

import { useInvestment, useInvestments } from '@/hooks/api';
import * as queries from '@/lib/queries';
import type { InvestmentAccount } from '@/book/models';

jest.mock('@/lib/queries');

describe('useInvestment', () => {
  let investment: InvestmentAccount;

  beforeEach(() => {
    investment = {
      account: {
        guid: 'guid',
      },
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestment').mockResolvedValue(investment);
    mutate('/api/investments', undefined);
    mutate('/api/investments/guid', undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns investment', async () => {
    const { result } = renderHook(() => useInvestment('guid'));

    await waitFor(() => expect(result.current.data).toEqual(investment));
  });

  it('calls query only once', async () => {
    const { result, rerender } = renderHook(() => useInvestment('guid'));

    rerender('guid');

    await waitFor(() => expect(result.current.data).toEqual(investment));
    expect(queries.getInvestment).toBeCalledTimes(1);
  });

  /**
   * When useInvestments has not been called yet, we leave it's data as
   * undefined as it's the only way to make sure to trigger the fetcher
   * for it.
   */
  it('useInvestments is triggered when no data', async () => {
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment]);
    const { result: r } = renderHook(() => useInvestment('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(investment));

    const { result } = renderHook(() => useInvestments());

    expect(queries.getInvestments).toBeCalledTimes(1);
    await waitFor(() => expect(result.current.data).toEqual([investment]));
  });

  /**
   * When adding a new investment account, if we modify
   * the /api/investments/guid key, we want it also to append this new investment
   * to the general /api/investments
   */
  it('appends investment when it doesnt exist in /api/investments', async () => {
    const existingInvestment = { account: { guid: '1' } };
    mutate('/api/investments', [existingInvestment]);
    const { result: r } = renderHook(() => useInvestment('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(investment));

    const { result } = renderHook(() => useInvestments());

    expect(queries.getInvestments).toBeCalledTimes(0);
    await waitFor(() => expect(result.current.data).toEqual([existingInvestment, investment]));
  });

  /**
   * When updating an investment account, we want to make sure that there is
   * consistency in /api/investments so we replace the already existing one
   * with the updated one
   */
  it('replaces investment when existing in /api/investments', async () => {
    const previousInvestment = { account: { guid: 'guid', type: 'ASSET' } };
    mutate('/api/investments', [previousInvestment]);
    const { result: r } = renderHook(() => useInvestment('guid'));

    // wait for the hook to populate the data
    await waitFor(() => expect(r.current.data).toEqual(investment));

    const { result } = renderHook(() => useInvestments());

    expect(queries.getInvestments).toBeCalledTimes(0);
    await waitFor(() => expect(result.current.data).toEqual([investment]));
  });
});

describe('useInvestments', () => {
  let investment1: InvestmentAccount;
  let investment2: InvestmentAccount;

  beforeEach(() => {
    investment1 = {
      account: {
        guid: 'guid1',
      },
    } as InvestmentAccount;
    investment2 = {
      account: {
        guid: 'guid2',
      },
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment1, investment2]);
    mutate('/api/investments', undefined);
    mutate('/api/investments/guid', undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns investments', async () => {
    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(result.current.data).toEqual([investment1, investment2]));
  });

  it('calls query only once', async () => {
    const { result, rerender } = renderHook(() => useInvestments());

    rerender('guid');

    await waitFor(() => expect(result.current.data).toEqual([investment1, investment2]));
    expect(queries.getInvestments).toBeCalledTimes(1);
  });

  it('populates individual keys', async () => {
    const { result } = renderHook(() => useInvestments());

    // wait for the hook to populate the data
    await waitFor(() => expect(result.current.data).toEqual([investment1, investment2]));

    const { result: r1 } = renderHook(() => useInvestment('guid1'));
    const { result: r2 } = renderHook(() => useInvestment('guid2'));

    expect(queries.getInvestment).toBeCalledTimes(0);
    await waitFor(() => expect(r1.current.data).toEqual(investment1));
    await waitFor(() => expect(r2.current.data).toEqual(investment2));
  });
});
