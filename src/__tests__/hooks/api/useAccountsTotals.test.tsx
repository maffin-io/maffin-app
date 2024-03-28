import { DateTime, Interval } from 'luxon';
import { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useAccountsTotals } from '@/hooks/api';
import * as incomeStatementHook from '@/hooks/api/useIncomeStatement';
import * as balanceSheetHook from '@/hooks/api/useBalanceSheet';
import * as stateHooks from '@/hooks/state';
import type { AccountsTotals } from '@/types/book';
import Money from '@/book/Money';

jest.mock('@/hooks/api/useIncomeStatement', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useIncomeStatement'),
}));

jest.mock('@/hooks/api/useBalanceSheet', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api/useBalanceSheet'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('useAccountsTotals', () => {
  beforeEach(() => {
    jest.spyOn(incomeStatementHook, 'useIncomeStatement').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    jest.spyOn(balanceSheetHook, 'useBalanceSheet').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('works when no data', async () => {
    const { result } = renderHook(() => useAccountsTotals());

    expect(result.current.data).toEqual({});
  });

  it('merges balance sheet and income statement', async () => {
    jest.spyOn(balanceSheetHook, 'useBalanceSheet').mockReturnValue({
      data: {
        type_asset: new Money(10, 'EUR'),
      } as AccountsTotals,
      dataUpdatedAt: 1,
    } as UseQueryResult<AccountsTotals>);
    jest.spyOn(incomeStatementHook, 'useIncomeStatement').mockReturnValue({
      data: {
        type_expense: new Money(20, 'EUR'),
      } as AccountsTotals,
      dataUpdatedAt: 1,
    } as UseQueryResult<AccountsTotals>);

    const { result } = renderHook(() => useAccountsTotals());

    expect(result.current.data?.type_asset.toString()).toEqual('10.00 EUR');
    expect(result.current.data?.type_expense.toString()).toEqual('20.00 EUR');

    expect(balanceSheetHook.useBalanceSheet).toBeCalledWith(TEST_INTERVAL.end, undefined);
    expect(incomeStatementHook.useIncomeStatement).toBeCalledWith(TEST_INTERVAL, undefined);
  });

  it('uses custom interval', async () => {
    const interval = Interval.fromDateTimes(
      DateTime.fromISO('2022'),
      DateTime.fromISO('2023'),
    );

    renderHook(() => useAccountsTotals(interval));

    expect(balanceSheetHook.useBalanceSheet).toBeCalledWith(interval.end, undefined);
    expect(incomeStatementHook.useIncomeStatement).toBeCalledWith(interval, undefined);
  });

  it('uses custom select', async () => {
    const mockSelect = jest.fn();

    renderHook(() => useAccountsTotals(undefined, mockSelect));

    expect(balanceSheetHook.useBalanceSheet).toBeCalledWith(TEST_INTERVAL.end, mockSelect);
    expect(incomeStatementHook.useIncomeStatement).toBeCalledWith(TEST_INTERVAL, mockSelect);
  });
});
