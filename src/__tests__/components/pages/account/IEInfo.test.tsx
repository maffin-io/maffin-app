import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';

import { IEInfo } from '@/components/pages/account';
import TotalWidget from '@/components/pages/account/TotalWidget';
import type { Account } from '@/book/entities';
import { TotalsPie, MonthlyTotalHistogram } from '@/components/charts';
import { AccountsTable } from '@/components/tables';

jest.mock('@/components/charts/MonthlyTotalHistogram', () => jest.fn(
  () => <div data-testid="MonthlyTotalHistogram" />,
));

jest.mock('@/components/charts/TotalsPie', () => jest.fn(
  () => <div data-testid="TotalsPie" />,
));

jest.mock('@/components/tables/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

jest.mock('@/components/pages/account/TotalWidget', () => jest.fn(
  () => <div data-testid="TotalWidget" />,
));

jest.mock('@/components/tables/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

describe('IEInfo', () => {
  let account: Account;
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-03-01') as DateTime<true>);
    account = {
      guid: 'guid',
      name: 'Expenses',
      type: 'EXPENSE',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected when not placeholder', () => {
    const { container } = render(
      <IEInfo account={account} />,
    );

    expect(MonthlyTotalHistogram).toBeCalledWith(
      {
        guids: [account.guid],
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

  it('renders as expected when placeholder', () => {
    account.placeholder = true;
    account.childrenIds = ['1', '2'];
    const { container } = render(
      <IEInfo account={account} />,
    );

    expect(AccountsTable).toBeCalledWith({ guids: ['1', '2'] }, {});
    expect(TotalsPie).toBeCalledWith(
      {
        guids: ['1', '2'],
        showDataLabels: false,
        showTooltip: true,
        title: 'Total spent',
      },
      {},
    );
    expect(MonthlyTotalHistogram).toBeCalledWith(
      {
        guids: ['1', '2'],
        title: '',
        interval: Interval.fromDateTimes(
          DateTime.now().minus({ year: 1 }).startOf('month'),
          DateTime.now(),
        ),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });
});
