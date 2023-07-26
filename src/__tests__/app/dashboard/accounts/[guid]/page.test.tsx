import React from 'react';
import { DateTime } from 'luxon';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import * as swr from 'swr';

import Money from '@/book/Money';
import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';
import TotalLineChart from '@/components/pages/account/TotalLineChart';
import { Account, Split } from '@/book/entities';
import * as queries from '@/book/queries';

jest.mock('swr', () => ({
  __esModule: true,
  ...jest.requireActual('swr'),
}));

jest.mock('@/components/buttons/TransactionFormButton', () => jest.fn(
  () => <div data-testid="TransactionFormButton" />,
));

jest.mock('@/components/TransactionsTable', () => jest.fn(
  () => <div data-testid="TransactionsTable" />,
));

jest.mock('@/components/pages/account/SplitsHistogram', () => jest.fn(
  () => <div data-testid="SplitsHistogram" />,
));

jest.mock('@/components/pages/account/TotalLineChart', () => jest.fn(
  () => <div data-testid="TotalLineChart" />,
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
        commodity: {
          mnemonic: 'EUR',
        },
        get total() { return new Money(100, 'EUR'); },
      } as Account,
    ]);
    mockFindSplits = jest.spyOn(Split, 'find').mockResolvedValue(
      [
        {
          guid: 'split_guid',
          transaction: {
            date: DateTime.fromISO('2023-01-01'),
          },
          account: {
            type: 'TYPE',
          },
          quantity: 100,
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
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
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
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
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
    expect(TransactionFormButton).toHaveBeenLastCalledWith(
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            {
              action: '',
              fk_account: {
                commodity: {
                  mnemonic: 'EUR',
                },
                guid: 'guid',
                path: 'path',
                splits: [],
                total: expect.any(Money),
                type: 'TYPE',
              },
              guid: expect.any(String),
              quantityNum: 0,
              quantityDenom: 1,
              valueNum: 0,
              valueDenom: 1,
            },
            {
              action: '',
              guid: expect.any(String),
              quantityNum: 0,
              quantityDenom: 1,
              valueNum: 0,
              valueDenom: 1,
            },
          ],
        },
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
            splits: [],
            commodity: {
              mnemonic: 'EUR',
            },
            total: expect.any(Money),
          },
        ],
        splits: [
          {
            guid: 'split_guid',
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            account: {
              type: 'TYPE',
            },
            quantity: 100,
          },
        ],
      },
      {},
    );
    expect(SplitsHistogram).toHaveBeenLastCalledWith(
      {
        splits: [
          {
            guid: 'split_guid',
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            account: {
              type: 'TYPE',
            },
            quantity: 100,
          },
        ],
      },
      {},
    );
    expect(TotalLineChart).toHaveBeenLastCalledWith(
      {
        splits: [
          {
            guid: 'split_guid',
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            account: {
              type: 'TYPE',
            },
            quantity: 100,
          },
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
