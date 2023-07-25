import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import * as swr from 'swr';

import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import { PriceDB, PriceDBMap } from '@/book/prices';
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

  it('mutates and saves when creating an account', async () => {
    const mockSave = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { save: mockSave as Function } as UseDataSourceReturn,
    );
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
    expect(mockSave).toBeCalledTimes(1);
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
