import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';

import { IEInfo } from '@/components/pages/account';
import StatisticsWidget from '@/components/StatisticsWidget';
import TotalWidget from '@/components/pages/account/TotalWidget';
import type { Account } from '@/book/entities';
import { MonthlyTotalHistogram } from '@/components/pages/accounts';

jest.mock('@/components/pages/accounts/MonthlyTotalHistogram', () => jest.fn(
  () => <div data-testid="MonthlyTotalHistogram" />,
));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/pages/account/TotalWidget', () => jest.fn(
  () => <div data-testid="TotalWidget" />,
));

jest.mock('@/components/pages/accounts/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

describe('IEInfo', () => {
  let account: Account;
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-03-01') as DateTime<true>);
    account = {
      guid: 'guid',
      name: 'Assets',
      type: 'ASSET',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected when no splits', () => {
    const { container } = render(
      <IEInfo account={account} />,
    );

    expect(MonthlyTotalHistogram).toBeCalledWith(
      {
        accounts: [account],
        title: '',
        interval: Interval.fromDateTimes(
          DateTime.now().minus({ year: 1 }).startOf('month'),
          DateTime.now(),
        ),
      },
      {},
    );
    expect(TotalWidget).toBeCalledWith(
      { account },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('shows account table when placeholder', () => {
    account.placeholder = true;
    render(
      <IEInfo account={account} />,
    );

    expect(StatisticsWidget).toBeCalledTimes(1);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'Subaccounts',
        description: '',
        statsTextClass: '!font-normal',
        // Don't know how to check for AccountsTable here
        stats: expect.anything(),
      },
      {},
    );
  });
});
