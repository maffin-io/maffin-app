import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import * as apiHook from '@/hooks/api';
import Money from '@/book/Money';
import type { AccountsTotals } from '@/types/book';
import type { Account, Commodity } from '@/book/entities';
import MonthChange from '@/components/widgets/MonthChange';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('MonthChange', () => {
  let account: Account;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    account = {
      guid: 'guid',
      commodity: {
        mnemonic: 'EUR',
      } as Commodity,
    } as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no data', () => {
    const { container } = render(<MonthChange account={account} className="mt-1" />);

    expect(apiHook.useAccountsTotals).toBeCalledTimes(2);
    expect(apiHook.useAccountsTotals).toHaveBeenNthCalledWith(1);
    expect(apiHook.useAccountsTotals).toHaveBeenNthCalledWith(
      2,
      DateTime.now().minus({ month: 1 }).endOf('month'),
    );
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with increase', () => {
    jest.spyOn(apiHook, 'useAccountsTotals')
      .mockReturnValueOnce({
        data: { guid: new Money(200, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>)
      .mockReturnValueOnce({
        data: { guid: new Money(100, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>);

    const { container } = render(<MonthChange account={account} />);

    screen.getByText('€100.00', { exact: false });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with decrease', () => {
    jest.spyOn(apiHook, 'useAccountsTotals')
      .mockReturnValueOnce({
        data: { guid: new Money(100, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>)
      .mockReturnValueOnce({
        data: { guid: new Money(200, 'EUR') } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>);

    const { container } = render(<MonthChange account={account} />);

    screen.getByText('-€100.00', { exact: false });
    expect(container).toMatchSnapshot();
  });
});
