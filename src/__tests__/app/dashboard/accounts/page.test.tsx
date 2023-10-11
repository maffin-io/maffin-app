import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import DateRangeInput from '@/components/DateRangeInput';
import Onboarding from '@/components/onboarding/Onboarding';
import {
  AccountsTable,
  NetWorthPie,
  NetWorthHistogram,
  MonthlyTotalHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/buttons/AddAccountButton', () => jest.fn(
  () => <div data-testid="AddAccountButton" />,
));

jest.mock('@/components/pages/accounts/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <div data-testid="DateRangeInput" />,
));

jest.mock('@/components/pages/accounts/NetWorthPie', () => jest.fn(
  () => <div data-testid="NetWorthPie" />,
));

jest.mock('@/components/pages/accounts/NetWorthHistogram', () => jest.fn(
  () => <div data-testid="NetWorthHistogram" />,
));

jest.mock('@/components/pages/accounts/MonthlyTotalHistogram', () => jest.fn(
  () => <div data-testid="MonthlyTotalHistogram" />,
));

jest.mock('@/components/pages/accounts/LatestTransactions', () => jest.fn(
  () => <div data-testid="LatestTransactions" />,
));

jest.mock('@/components/onboarding/Onboarding', () => jest.fn(
  () => <div data-testid="Onboarding" />,
));

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ isLoading: true } as SWRResponse);
    render(<AccountsPage />);

    await screen.findByText('Loading...');
  });

  it('shows onboarding when no data', async () => {
    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'useStartDate').mockReturnValueOnce({ data: date } as SWRResponse);
    const { container } = render(<AccountsPage />);

    await screen.findByTestId('AddAccountButton');
    expect(AddAccountButton).toHaveBeenLastCalledWith({}, {});

    await screen.findByTestId('Onboarding');
    expect(Onboarding).toHaveBeenLastCalledWith(
      {
        show: true,
      },
      {},
    );

    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        selectedDate: DateTime.fromISO('2023-01-02'),
        isExpanded: true,
      },
      {},
    );

    await screen.findByTestId('DateRangeInput');
    expect(DateRangeInput).toHaveBeenLastCalledWith(
      {
        asSingle: true,
        dateRange: {
          start: DateTime.fromISO('2023-01-02'),
          end: DateTime.fromISO('2023-01-02'),
        },
        earliestDate: DateTime.fromISO('2022-01-01'),
        onChange: expect.any(Function),
      },
      {},
    );

    await screen.findByTestId('NetWorthPie');
    expect(NetWorthPie).toHaveBeenLastCalledWith(
      {
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    await screen.findByTestId('NetWorthHistogram');
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        selectedDate: DateTime.fromISO('2023-01-02'),
        startDate: DateTime.fromISO('2022-01-01'),
      },
      {},
    );

    expect(screen.getAllByTestId('MonthlyTotalHistogram')).toHaveLength(2);
    expect(MonthlyTotalHistogram).toBeCalledTimes(2);
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        accounts: undefined,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        accounts: undefined,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    await screen.findByTestId('LatestTransactions');
    expect(LatestTransactions).toHaveBeenLastCalledWith({}, {});

    expect(container).toMatchSnapshot();
  });

  it('passes data as expected when available', async () => {
    const accounts = {
      root: {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a3', 'a5'],
      } as Account,
      type_expense: {
        guid: 'a3',
        name: 'Expenses',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        childrenIds: ['a4'] as string[],
      } as Account,
      a4: {
        guid: 'a4',
        name: 'Groceries',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        childrenIds: [] as string[],
      } as Account,
      type_income: {
        guid: 'a5',
        name: 'Income',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        childrenIds: ['a6'] as string[],
      } as Account,
      a6: {
        guid: 'a6',
        name: 'Salary',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        childrenIds: [] as string[],
      } as Account,
    };

    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'useStartDate').mockReturnValueOnce({ data: date } as SWRResponse);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValueOnce({ data: accounts } as SWRResponse);

    render(<AccountsPage />);

    await screen.findByTestId('Onboarding');
    expect(Onboarding).toHaveBeenLastCalledWith(
      {
        show: false,
      },
      {},
    );

    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(1);
    expect(AccountsTable).toHaveBeenLastCalledWith({
      isExpanded: false,
      selectedDate: DateTime.now(),
    }, {});
    expect(NetWorthPie).toHaveBeenLastCalledWith({
      selectedDate: DateTime.now(),
    }, {});
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        startDate: date,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        selectedDate: DateTime.fromISO('2023-01-02'),
        accounts: [accounts.a6],
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        selectedDate: DateTime.fromISO('2023-01-02'),
        accounts: [accounts.a4],
      },
      {},
    );
  });
});
