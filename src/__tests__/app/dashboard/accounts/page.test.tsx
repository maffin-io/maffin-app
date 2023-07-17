import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import { SWRConfig } from 'swr';
import crypto from 'crypto';

import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/AddAccountButton';
import { PriceDB, PriceDBMap } from '@/book/prices';
import * as queries from '@/book/queries';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/AddAccountButton', () => jest.fn(
  () => <div data-testid="AddAccountButton" />,
));
const AddAccountButtonMock = AddAccountButton as jest.MockedFunction<typeof AddAccountButton>;

jest.mock('@/components/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));
const AccountsTableMock = AccountsTable as jest.MockedFunction<typeof AccountsTable>;

describe('AccountsPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes empty array to table when not ready', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(AddAccountButtonMock).toHaveBeenCalledWith({}, {});
    expect(AccountsTableMock).toHaveBeenCalledWith(
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
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toHaveBeenCalledWith({
      relations: { splits: true },
      showRoot: true,
    });
    expect(AccountsTableMock).toHaveBeenLastCalledWith(
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
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');

    rerender(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toBeCalledTimes(1);
    expect(PriceDB.getTodayQuotes).toBeCalledTimes(1);
  });
});
