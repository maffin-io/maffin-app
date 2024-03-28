import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { Header } from '@/components/pages/account';
import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Account, Split } from '@/book/entities';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
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

describe('Header', () => {
  beforeEach(() => {
    jest.spyOn(Split, 'create').mockReturnValue({ guid: 'createdSplit' } as Split);
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ data: undefined } as UseQueryResult<Account>);
    jest.spyOn(apiHook, 'useSplitsPagination').mockReturnValue({ data: undefined } as UseQueryResult<Split[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({
      data: { guid: 'parent' } as Account,
    } as UseQueryResult<Account>);

    const { container } = render(<Header account={account} />);

    await screen.findAllByTestId('FormButton');
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
          parent: {
            guid: 'parent',
          },
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
          parent: {
            guid: 'parent',
          },
        },
        onSave: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('shows parent link', async () => {
    const account = {
      guid: 'guid',
      path: 'Assets:account',
      name: 'account',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({
      data: { guid: 'parent' } as Account,
    } as UseQueryResult<Account>);

    const { container } = render(<Header account={account} />);
    expect(container).toMatchSnapshot();
  });
});
