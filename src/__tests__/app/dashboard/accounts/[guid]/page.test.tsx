import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import { SWRConfig } from 'swr';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import { TransactionsTableProps } from '@/components/TransactionsTable';
import { AddTransactionButtonProps } from '@/components/AddTransactionButton';
import { Account, Split } from '@/book/entities';
import * as queries from '@/book/queries';

jest.mock('@/components/AddTransactionButton', () => {
  function AddTransactionButton(props: AddTransactionButtonProps) {
    return (
      <div className="AddTransactionButton">
        <span>{JSON.stringify(props)}</span>
      </div>
    );
  }

  return AddTransactionButton;
});

jest.mock('@/components/TransactionsTable', () => {
  function TransactionsTable(props: TransactionsTableProps) {
    return (
      <div className="TransactionsTable">
        <span>{JSON.stringify(props)}</span>
      </div>
    );
  }

  return TransactionsTable;
});

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
    jest.resetAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </SWRConfig>,
    );

    await screen.findByText('Loading...');
    expect(container).toMatchSnapshot();
  });

  it('returns 404 when account not found', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      { guid: 'other' } as Account,
    ]);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </SWRConfig>,
    );

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/404'));
  });

  it('renders as expected with account', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountPage params={{ guid: 'guid' }} />
      </SWRConfig>,
    );

    await screen.findAllByText(/guid/);
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
    expect(container).toMatchSnapshot();
  });

  it('retrieves splits and accounts once only', async () => {
    const { rerender } = render(
      <AccountPage params={{ guid: 'guid' }} />,
    );

    rerender(
      <AccountPage params={{ guid: 'guid' }} />,
    );

    await screen.findAllByText(/guid/);

    expect(queries.getAccountsWithPath).toHaveBeenCalledTimes(1);
    expect(mockFindSplits).toHaveBeenCalledTimes(1);
  });
});
