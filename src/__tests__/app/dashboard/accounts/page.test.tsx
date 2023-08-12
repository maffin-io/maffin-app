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

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes empty data to components when loading when not ready', async () => {
    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'useStartDate').mockReturnValueOnce({ data: date } as SWRResponse);
    const { container } = render(<AccountsPage />);

    await screen.findByTestId('AddAccountButton');
    expect(AddAccountButton).toHaveBeenLastCalledWith({}, {});

    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        accounts: {
          root: {
            childrenIds: [],
          },
        },
        monthlyTotals: {},
        selectedDate: DateTime.fromISO('2023-01-02'),
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
        assetSeries: undefined,
        liabilitiesSeries: undefined,
        unit: undefined,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    await screen.findByTestId('NetWorthHistogram');
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        monthlyTotals: {},
        tree: {
          account: { childrenIds: [] },
          leaves: [],
        },
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
        tree: undefined,
        monthlyTotals: {},
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        tree: undefined,
        monthlyTotals: {},
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
        childrenIds: ['a1', 'a3', 'a5'],
      } as Account,
      a1: {
        guid: 'a1',
        name: 'Assets',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      a2: {
        guid: 'a2',
        name: 'Bank',
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
      a3: {
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
      a5: {
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

    const monthlyTotals = {
      a1: {
        '01/2023': 703,
        '02/2023': 303,
      },
      a2: {
        '01/2023': 700,
        '02/2023': 300,
      },
      a3: {
        '01/2023': 1400,
        '02/2023': 600,
      },
      a4: {
        '01/2023': 700,
        '02/2023': 300,
      },
      a5: {
        '01/2023': -2000,
        '02/2023': -2000,
      },
      a6: {
        '01/2023': -1000,
        '02/2023': -1000,
      },
    };

    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'useStartDate').mockReturnValueOnce({ data: date } as SWRResponse);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValueOnce({ data: accounts } as SWRResponse);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValueOnce({
      data: monthlyTotals,
    } as SWRResponse);

    render(<AccountsPage />);

    const expectedTree = {
      account: accounts.root,
      leaves: [
        {
          account: accounts.a1,
          leaves: [
            {
              account: accounts.a2,
              leaves: [],
            },
          ],
        },
        {
          account: accounts.a3,
          leaves: [
            {
              account: accounts.a4,
              leaves: [],
            },
          ],
        },
        {
          account: accounts.a5,
          leaves: [
            {
              account: accounts.a6,
              leaves: [],
            },
          ],
        },
      ],
    };
    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(1);
    expect(AccountsTable).toHaveBeenLastCalledWith({
      accounts,
      monthlyTotals,
      selectedDate: DateTime.now(),
    }, {});
    expect(NetWorthPie).toHaveBeenLastCalledWith({
      assetsSeries: monthlyTotals.a1,
      liabilitiesSeries: undefined,
      selectedDate: DateTime.now(),
      unit: 'EUR',
    }, {});
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        tree: expectedTree,
        monthlyTotals,
        startDate: date,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        tree: expectedTree.leaves[2],
        monthlyTotals,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        tree: expectedTree.leaves[1],
        monthlyTotals,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
  });
});
