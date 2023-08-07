import React from 'react';
import { DateTime } from 'luxon';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import { Account, Split } from '@/book/entities';
import * as apiHook from '@/hooks/useApi';
import { SplitsHistogram, TotalLineChart } from '@/components/pages/account';

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
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

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('AccountPage', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
    jest.spyOn(apiHook, 'default').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByText('Loading...');
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
    expect(apiHook.default).toBeCalledTimes(2);
    expect(apiHook.default).toHaveBeenNthCalledWith(1, '/api/accounts');
    expect(apiHook.default).toHaveBeenNthCalledWith(2, '/api/splits/<guid>', { guid: 'guid' });
    expect(container).toMatchSnapshot();
  });

  it('returns 404 when account not found', async () => {
    jest.spyOn(apiHook, 'default')
      .mockReturnValueOnce({ data: [{ guid: 'other' }] } as SWRResponse)
      .mockReturnValueOnce({ data: [] } as SWRResponse);

    render(<AccountPage params={{ guid: 'guid' }} />);

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/404'));
    expect(TransactionFormButton).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
  });

  it('renders as expected with account', async () => {
    const accounts = [
      {
        guid: 'guid',
        path: 'path',
        type: 'TYPE',
        commodity: {
          mnemonic: 'EUR',
        },
        getTotal: () => new Money(100, 'EUR'),
      } as Account,
    ];

    const splits = [
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
    ];

    jest.spyOn(apiHook, 'default')
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: splits } as SWRResponse);
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('TransactionsTable');
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
                getTotal: expect.any(Function),
                type: 'TYPE',
              },
              guid: expect.any(String),
            },
            {
              action: '',
              guid: expect.any(String),
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
            getTotal: expect.any(Function),
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
});
