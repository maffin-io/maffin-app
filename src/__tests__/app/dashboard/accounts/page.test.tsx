import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import DateRangeInput from '@/components/DateRangeInput';
import Onboarding from '@/components/onboarding/Onboarding';
import {
  AccountsTable,
  NetWorthPie,
  MonthlyTotalHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import { NetWorthHistogram } from '@/components/charts';
import IncomeExpenseHistogram from '@/components/pages/accounts/IncomeExpenseHistogram';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/account/AccountForm', () => jest.fn(
  () => <div data-testid="AccountForm" />,
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

jest.mock('@/components/pages/accounts/IncomeExpenseHistogram', () => jest.fn(
  () => <div data-testid="IncomeExpenseHistogram" />,
));

jest.mock('@/components/charts/NetWorthHistogram', () => jest.fn(
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

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02') as DateTime<true>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ isLoading: true } as UseQueryResult<Account[]>);
    render(<AccountsPage />);

    await screen.findByTestId('Loading');
  });

  it('renders as expected when no data showing onboarding', async () => {
    const { container } = render(<AccountsPage />);

    await screen.findByTestId('FormButton');
    expect(FormButton).toHaveBeenLastCalledWith(
      expect.objectContaining({
        modalTitle: 'Add account',
        id: 'add-account',
      }),
      {},
    );
    expect(AccountForm).toHaveBeenLastCalledWith(
      {},
      {},
    );

    await screen.findByTestId('Onboarding');
    expect(Onboarding).toHaveBeenLastCalledWith(
      {
        show: true,
      },
      {},
    );

    await screen.findAllByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledWith(
      {
        guids: [undefined, undefined],
        selectedDate: DateTime.fromISO('2023-01-02'),
        isExpanded: true,
      },
      {},
    );
    expect(AccountsTable).toBeCalledWith(
      {
        guids: [undefined, undefined],
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

    await screen.findByTestId('IncomeExpenseHistogram');
    expect(IncomeExpenseHistogram).toHaveBeenLastCalledWith(
      {
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    await screen.findByTestId('NetWorthHistogram');
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        assetsGuid: 'type_asset',
        liabilitiesGuid: 'type_liability',
        selectedDate: DateTime.fromISO('2023-01-02'),
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
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a3', 'a5'],
      } as Account,
      {
        guid: 'a3',
        name: 'Expenses',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        parentId: 'root',
        childrenIds: ['a4'] as string[],
      } as Account,
      {
        guid: 'a4',
        name: 'Groceries',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        parentId: 'a3',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a5',
        name: 'Income',
        parentId: 'root',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        childrenIds: ['a6'] as string[],
      } as Account,
      {
        guid: 'a6',
        name: 'Salary',
        commodity: {
          mnemonic: 'EUR',
        },
        parentId: 'a5',
        type: 'INCOME',
        childrenIds: [] as string[],
      } as Account,
    ];

    jest.spyOn(apiHook, 'useAccounts').mockReturnValueOnce({ data: accounts } as UseQueryResult<Account[]>);

    render(<AccountsPage />);

    await screen.findByTestId('Onboarding');
    expect(Onboarding).toHaveBeenLastCalledWith(
      {
        show: false,
      },
      {},
    );

    await screen.findAllByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(2);
    expect(AccountsTable).toBeCalledWith({
      guids: [undefined, undefined],
      isExpanded: false,
      selectedDate: DateTime.now(),
    }, {});
    expect(AccountsTable).toBeCalledWith({
      guids: ['a5', 'a3'],
      isExpanded: false,
      selectedDate: DateTime.now(),
    }, {});
    expect(NetWorthPie).toHaveBeenLastCalledWith({
      selectedDate: DateTime.now(),
    }, {});
    expect(IncomeExpenseHistogram).toHaveBeenLastCalledWith(
      {
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        assetsGuid: 'type_asset',
        liabilitiesGuid: 'type_liability',
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        selectedDate: DateTime.fromISO('2023-01-02'),
        accounts: [accounts[4]],
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        selectedDate: DateTime.fromISO('2023-01-02'),
        accounts: [accounts[2]],
      },
      {},
    );
  });
});
