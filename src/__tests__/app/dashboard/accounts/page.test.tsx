import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import * as swr from 'swr';
import crypto from 'crypto';

import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import { PriceDB, PriceDBMap } from '@/book/prices';
import * as queries from '@/book/queries';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

jest.mock('swr', () => ({
  __esModule: true,
  ...jest.requireActual('swr'),
}));

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/buttons/AddAccountButton', () => jest.fn(
  () => <div data-testid="AddAccountButton" />,
));
const AddAccountButtonMock = AddAccountButton as jest.MockedFunction<typeof AddAccountButton>;

jest.mock('@/components/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

describe('AccountsPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes empty array to table when not ready', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(AddAccountButton).toHaveBeenCalledWith(
      {
        onSave: expect.any(Function),
      },
      {},
    );
    expect(AccountsTable).toHaveBeenCalledWith(
      {
        accounts: [],
        todayPrices: {
          map: {},
        },
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('mutates when saving an account', async () => {
    jest.spyOn(swr, 'mutate');
    render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    const { onSave } = AddAccountButtonMock.mock.calls[0][0];
    if (onSave) {
      onSave();
    }
    expect(swr.mutate).toBeCalledTimes(2);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/accounts');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/accounts/splits');
  });

  it('passes data to table', async () => {
    jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue({
      map: {},
    } as PriceDBMap);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: 'guid1',
      } as Account,
      {
        guid: 'guid2',
      } as Account,
    ]);

    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toHaveBeenCalledWith({
      relations: { splits: true },
      showRoot: true,
    });
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        accounts: [
          { guid: 'guid1' },
          { guid: 'guid2' },
        ],
        todayPrices: {
          map: {},
        },
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('calls data once', async () => {
    const { rerender } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');

    rerender(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toBeCalledTimes(1);
    expect(PriceDB.getTodayQuotes).toBeCalledTimes(1);
  });
});
