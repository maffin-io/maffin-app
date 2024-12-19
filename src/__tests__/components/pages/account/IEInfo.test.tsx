import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';

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

    expect(MonthlyTotalHistogram).toHaveBeenCalledWith(
      {
        guids: [account.guid],
        title: '',
      },
      undefined,
    );
    expect(TotalWidget).toHaveBeenCalledWith(
      { account },
      undefined,
    );
    expect(container).toMatchSnapshot();
  });

  it.each([
    ['INCOME', 'Total earned'],
    ['EXPENSE', 'Total spent'],
    ['EQUITY', 'Total'],
  ])('renders as expected when placeholder with %s', (type, title) => {
    account.placeholder = true;
    account.childrenIds = ['1', '2'];
    account.type = type;
    const { container } = render(
      <IEInfo account={account} />,
    );

    expect(AccountsTable).toHaveBeenCalledWith({ guids: ['1', '2'] }, undefined);
    expect(TotalsPie).toHaveBeenCalledWith(
      {
        guids: ['1', '2'],
        showDataLabels: false,
        showTooltip: true,
        title,
      },
      undefined,
    );
    expect(MonthlyTotalHistogram).toHaveBeenCalledWith(
      {
        guids: ['1', '2'],
        title: '',
      },
      undefined,
    );
    expect(container).toMatchSnapshot();
  });
});
