import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import * as swr from 'swr';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import TransactionsTable from '@/components/TransactionsTable';
import AddTransactionButton from '@/components/buttons/AddTransactionButton';
import { Account, Split } from '@/book/entities';
import * as queries from '@/book/queries';
import * as dataSourceHooks from '@/hooks/useDataSource';
import type { UseDataSourceReturn } from '@/hooks';

jest.mock('swr', () => ({
  __esModule: true,
  ...jest.requireActual('swr'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/components/buttons/AddTransactionButton', () => jest.fn(
  () => <div data-testid="AddTransactionButton" />,
));
const AddTransactionButtonMock = AddTransactionButton as jest.MockedFunction<
  typeof AddTransactionButton
>;

jest.mock('@/components/TransactionsTable', () => jest.fn(
  () => <div data-testid="TransactionsTable" />,
));

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('AccountPage', () => {
  let mockRouterPush: jest.Mock;
  let mockFindSplits: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(swr, 'mutate');
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: 'guid',
        path: 'path',
        type: 'TYPE',
      } as Account,
    ]);
    mockFindSplits = jest.spyOn(Split, 'find').mockResolvedValue(
      [
        {
          guid: 'split_guid',
        } as Split,
      ],
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </swr.SWRConfig>,
    );

    await screen.findByText('Loading...');
    expect(AddTransactionButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('returns 404 when account not found', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      { guid: 'other' } as Account,
    ]);

    render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </swr.SWRConfig>,
    );

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/404'));
    expect(AddTransactionButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
  });

  it('mutates and saves when saving a transaction', async () => {
    const mockSave = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { save: mockSave as Function } as UseDataSourceReturn,
    );

    render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('TransactionsTable');
    const { onSave } = AddTransactionButtonMock.mock.calls[0][0];
    if (onSave) {
      onSave();
    }
    expect(swr.mutate).toBeCalledTimes(1);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/guid');
    expect(mockSave).toBeCalledTimes(1);
  });

  it('renders as expected with account', async () => {
    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('TransactionsTable');
    expect(mockFindSplits).toHaveBeenCalledWith({
      where: {
        fk_account: {
          guid: 'guid',
        },
      },
      relations: {
        fk_transaction: {
          splits: {
            fk_account: true,
          },
        },
        fk_account: true,
      },
      order: {
        fk_transaction: {
          date: 'DESC',
        },
        quantityNum: 'ASC',
      },
    });
    expect(AddTransactionButton).toHaveBeenLastCalledWith(
      {
        account: {
          guid: 'guid',
          path: 'path',
          type: 'TYPE',
        },
        onSave: expect.any(Function),
      },
      {},
    );
    expect(TransactionsTable).toHaveBeenLastCalledWith(
      {
        accounts: [
          {
            guid: 'guid',
            path: 'path',
            type: 'TYPE',
          },
        ],
        splits: [
          { guid: 'split_guid' },
        ],
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('retrieves splits and accounts once only', async () => {
    const { rerender } = render(
      <AccountPage params={{ guid: 'guid' }} />,
    );

    rerender(
      <AccountPage params={{ guid: 'guid' }} />,
    );

    await screen.findByTestId('TransactionsTable');
    expect(queries.getAccountsWithPath).toHaveBeenCalledTimes(1);
    expect(mockFindSplits).toHaveBeenCalledTimes(1);
  });
});
