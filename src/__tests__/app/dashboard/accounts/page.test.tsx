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
import Onboarding from '@/components/onboarding/Onboarding';
import {
  LatestTransactions,
} from '@/components/pages/accounts';
import { AccountsTable } from '@/components/tables';
import { TotalsPie, MonthlyTotalHistogram, NetWorthHistogram } from '@/components/charts';
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

jest.mock('@/components/tables/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

jest.mock('@/components/charts/TotalsPie', () => jest.fn(
  () => <div data-testid="TotalsPie" />,
));

jest.mock('@/components/pages/accounts/IncomeExpenseHistogram', () => jest.fn(
  () => <div data-testid="IncomeExpenseHistogram" />,
));

jest.mock('@/components/charts/NetWorthHistogram', () => jest.fn(
  () => <div data-testid="NetWorthHistogram" />,
));

jest.mock('@/components/charts/MonthlyTotalHistogram', () => jest.fn(
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
        isExpanded: true,
      },
      {},
    );
    expect(AccountsTable).toBeCalledWith(
      {
        guids: [undefined, undefined],
        isExpanded: true,
      },
      {},
    );

    await screen.findByTestId('TotalsPie');
    expect(TotalsPie).toHaveBeenLastCalledWith(
      {
        backgroundColor: ['#06B6D4', '#FF6600'],
        guids: [undefined, undefined],
        title: 'Net worth',
      },
      {},
    );

    await screen.findByTestId('IncomeExpenseHistogram');
    expect(IncomeExpenseHistogram).toHaveBeenLastCalledWith(
      {
      },
      {},
    );

    await screen.findByTestId('NetWorthHistogram');
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        assetsGuid: 'type_asset',
        liabilitiesGuid: 'type_liability',
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
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        accounts: undefined,
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
      {
        guid: 'a7',
        name: 'Assets',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        parentId: 'root',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a8',
        name: 'Liabilities',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'LIABILITY',
        parentId: 'root',
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
      guids: ['a7', 'a8'],
      isExpanded: false,
    }, {});
    expect(AccountsTable).toBeCalledWith({
      guids: ['a5', 'a3'],
      isExpanded: false,
    }, {});
    expect(TotalsPie).toHaveBeenLastCalledWith({
      backgroundColor: ['#06B6D4', '#FF6600'],
      guids: ['a7', 'a8'],
      title: 'Net worth',
    }, {});
    expect(IncomeExpenseHistogram).toHaveBeenLastCalledWith({}, {});
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        assetsGuid: 'type_asset',
        liabilitiesGuid: 'type_liability',
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        guids: [accounts[4].guid],
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        guids: [accounts[2].guid],
      },
      {},
    );
  });
});
