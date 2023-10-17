import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import AccountFormButton from '@/components/buttons/AccountFormButton';
import { Account, Split } from '@/book/entities';
import * as apiHook from '@/hooks/api';
import {
  SplitsHistogram,
  TotalLineChart,
  TransactionsTable,
} from '@/components/pages/account';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/buttons/TransactionFormButton', () => jest.fn(
  () => <div data-testid="TransactionFormButton" />,
));

jest.mock('@/components/buttons/AccountFormButton', () => jest.fn(
  () => <div data-testid="AccountFormButton" />,
));

jest.mock('@/components/pages/account/TransactionsTable', () => jest.fn(
  () => <div data-testid="TransactionsTable" />,
));

jest.mock('@/components/pages/account/SplitsHistogram', () => jest.fn(
  () => <div data-testid="SplitsHistogram" />,
));

jest.mock('@/components/pages/account/TotalLineChart', () => jest.fn(
  () => <div data-testid="TotalLineChart" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('AccountPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('Loading');
    expect(AccountFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('displays message when account not found', async () => {
    jest.spyOn(apiHook, 'useAccounts')
      .mockReturnValueOnce({ data: [{ guid: 'other' }] } as SWRResponse);

    render(<AccountPage params={{ guid: 'guid' }} />);

    screen.getByText('does not exist', { exact: false });
    expect(AccountFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
  });

  it('renders as expected with account', async () => {
    const accounts = {
      guid: {
        guid: 'guid',
        path: 'path',
        type: 'TYPE',
        commodity: {
          mnemonic: 'EUR',
        },
      } as Account,
    };
    const splits = [
      {
        guid: 'split_guid',
        transaction: {
          date: DateTime.fromISO('2023-01-01'),
          splits: [
            { guid: 'split_guid' },
            { guid: 'split_guid_2' },
          ],
        },
        account: {
          guid: 'guid',
          type: 'TYPE',
        },
        quantity: 100,
      } as Split,
    ];

    jest.spyOn(apiHook, 'useAccounts').mockReturnValueOnce({ data: accounts } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValueOnce({ data: splits } as SWRResponse);

    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('TransactionsTable');
    expect(TransactionFormButton).toHaveBeenLastCalledWith(
      {
        account: accounts.guid,
        defaultValues: {
          date: '2023-01-01',
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [],
        },
      },
      {},
    );
    expect(AccountFormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: 'update',
        defaultValues: {
          commodity: {
            mnemonic: 'EUR',
          },
          guid: 'guid',
          parent: undefined,
          path: 'path',
          type: 'TYPE',
        },
      }),
      {},
    );
    expect(AccountFormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'delete',
        className: 'btn btn-danger',
        'data-tooltip-id': 'delete-help',
        disabled: true,
        defaultValues: {
          commodity: {
            mnemonic: 'EUR',
          },
          guid: 'guid',
          parent: undefined,
          path: 'path',
          type: 'TYPE',
        },
      }),
      {},
    );
    expect(TransactionsTable).toHaveBeenLastCalledWith(
      {
        account: accounts.guid,
      },
      {},
    );
    expect(SplitsHistogram).toHaveBeenLastCalledWith(
      {
        account: accounts.guid,
      },
      {},
    );
    expect(TotalLineChart).toHaveBeenLastCalledWith(
      {
        account: accounts.guid,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });
});
