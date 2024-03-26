import React from 'react';
import { Interval } from 'luxon';
import { render, screen } from '@testing-library/react';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

import * as apiHook from '@/hooks/api';
import * as stateHooks from '@/hooks/state';
import Money from '@/book/Money';
import type { AccountsTotals } from '@/types/book';
import type { Account, Commodity } from '@/book/entities';
import TotalChange from '@/components/widgets/TotalChange';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('TotalChange', () => {
  let account: Account;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useBalanceSheet').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    account = {
      guid: 'guid',
      commodity: {
        mnemonic: 'EUR',
      } as Commodity,
    } as Account;
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no data', () => {
    const { container } = render(<TotalChange account={account} className="mt-1" />);

    expect(apiHook.useBalanceSheet).toBeCalledTimes(2);
    expect(
      apiHook.useBalanceSheet,
    ).toHaveBeenNthCalledWith(1, TEST_INTERVAL.start?.minus({ day: 1 }));
    expect(apiHook.useBalanceSheet).toHaveBeenNthCalledWith(2, TEST_INTERVAL.end);
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with increase', () => {
    jest.spyOn(apiHook, 'useBalanceSheet')
      .mockReturnValueOnce({
        data: { guid: new Money(100, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>)
      .mockReturnValueOnce({
        data: { guid: new Money(200, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>);

    const { container } = render(<TotalChange account={account} />);

    screen.getByText('€100.00', { exact: false });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with decrease', () => {
    jest.spyOn(apiHook, 'useBalanceSheet')
      .mockReturnValueOnce({
        data: { guid: new Money(200, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>)
      .mockReturnValueOnce({
        data: { guid: new Money(100, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>);

    const { container } = render(<TotalChange account={account} />);

    screen.getByText('€100.00', { exact: false });
    expect(container).toMatchSnapshot();
  });
});
