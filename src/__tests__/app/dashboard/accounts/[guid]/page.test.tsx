import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Account, Split } from '@/book/entities';
import * as apiHook from '@/hooks/api';
import {
  AccountInfo,
  TransactionsTable,
} from '@/components/pages/account';

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

jest.mock('@/components/forms/transaction/TransactionForm', () => jest.fn(
  () => <div data-testid="TransactionForm" />,
));

jest.mock('@/components/pages/account/TransactionsTable', () => jest.fn(
  () => <div data-testid="TransactionsTable" />,
));

jest.mock('@/components/pages/account/AccountInfo', () => jest.fn(
  () => <div data-testid="AccountInfo" />,
));

jest.mock('@/components/pages/account/InvestmentInfo', () => jest.fn(
  () => <div data-testid="InvestmentInfo" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('AccountPage', () => {
  beforeEach(() => {
    jest.spyOn(Split, 'create').mockReturnValue({ guid: 'createdSplit' } as Split);
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ isLoading: true } as SWRResponse);
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('Loading');
    expect(FormButton).toHaveBeenCalledTimes(0);
    expect(FormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('displays message when account not found', async () => {
    render(<AccountPage params={{ guid: 'guid' }} />);

    screen.getByText('does not exist', { exact: false });
    expect(FormButton).toHaveBeenCalledTimes(0);
    expect(FormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
  });

  it('renders as expected with account', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;
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

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({ data: account } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValueOnce({ data: splits } as SWRResponse);

    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('TransactionsTable');
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'add-tx',
        modalTitle: 'Add transaction to undefined',
      }),
      {},
    );
    expect(TransactionForm).toBeCalledWith(
      {
        defaultValues: {
          date: '2023-01-01',
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            { guid: 'createdSplit' },
            {
              action: '',
              guid: expect.any(String),
            },
          ],
        },
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'edit-account',
        modalTitle: 'Edit account',
      }),
      {},
    );
    expect(AccountForm).toHaveBeenNthCalledWith(
      1,
      {
        action: 'update',
        defaultValues: {
          ...account,
        },
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        className: 'btn btn-danger',
        'data-tooltip-id': 'delete-help',
        disabled: true,
        id: 'delete-account',
        modalTitle: 'Confirm you want to remove this account',
      }),
      {},
    );
    expect(AccountForm).toHaveBeenNthCalledWith(
      2,
      {
        action: 'delete',
        defaultValues: {
          ...account,
        },
      },
      {},
    );
    expect(TransactionsTable).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
    expect(AccountInfo).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('shows investment info when account is stock', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      type: 'INVESTMENT',
      commodity: {
        mnemonic: 'GOOGL',
      },
      parentId: 'parent',
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({ data: account } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValueOnce({ data: [] } as SWRResponse);

    render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('InvestmentInfo');
  });
});
