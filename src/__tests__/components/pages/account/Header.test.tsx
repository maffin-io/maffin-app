import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import { Header } from '@/components/pages/account';
import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import AddTxDropdown from '@/components/buttons/AddTxDropdown';
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

jest.mock('@/components/buttons/AddTxDropdown', () => jest.fn(
  () => <div data-testid="AddTxDropdown" />,
));

describe('Header', () => {
  beforeEach(() => {
    jest.spyOn(Split, 'create').mockReturnValue({ guid: 'createdSplit' } as Split);
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ data: undefined } as UseQueryResult<Account>);
    jest.spyOn(apiHook, 'useSplitsPagination').mockReturnValue({ data: [] as Split[] } as UseQueryResult<Split[]>);
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
      childrenIds: [] as String[],
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({
      data: { guid: 'parent' } as Account,
    } as UseQueryResult<Account>);

    const { container } = render(<Header account={account} />);

    expect(AddTxDropdown).toBeCalledWith(
      {
        account,
        latestDate: DateTime.now(),
      },
      undefined,
    );
    await screen.findAllByTestId('FormButton');
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'edit-account',
        modalTitle: 'Edit account',
      }),
      undefined,
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
      undefined,
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        className: 'btn btn-danger',
        'data-tooltip-id': 'delete-help',
        disabled: false,
        id: 'delete-account',
        modalTitle: 'Confirm you want to remove this account',
      }),
      undefined,
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
      undefined,
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
      childrenIds: [] as String[]
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({
      data: { guid: 'parent' } as Account,
    } as UseQueryResult<Account>);

    const { container } = render(<Header account={account} />);
    expect(container).toMatchSnapshot();
  });

  it('delete is disabled if contains children', async () => {
    const account = {
      guid: 'guid',
      path: 'Assets:account',
      name: 'account',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
      childrenIds: [
        "child_guid"
      ]
    } as Account;

    render(<Header account={account} />);

    expect(FormButton).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'btn btn-danger',
        'data-tooltip-id': 'delete-help',
        disabled: true,
        id: 'delete-account',
        modalTitle: 'Confirm you want to remove this account',
      }),
      undefined,
    );
  });

  it('delete is disabled if contains splits', async () => {
    const account = {
      guid: 'guid',
      path: 'Assets:account',
      name: 'account',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
      childrenIds: [] as String[]
    } as Account;

    jest.spyOn(apiHook, 'useSplitsPagination').mockReturnValueOnce({
      data: { length: 1 } as Split[],
    } as UseQueryResult<Split[]>);

    render(<Header account={account} />);

    expect(FormButton).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'btn btn-danger',
        'data-tooltip-id': 'delete-help',
        disabled: true,
        id: 'delete-account',
        modalTitle: 'Confirm you want to remove this account',
      }),
      undefined,
    );
  });
});
