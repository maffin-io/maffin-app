import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import * as swr from 'swr';
import { DateTime, Interval } from 'luxon';

import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import DateRangeInput from '@/components/DateRangeInput';
import { PriceDB, PriceDBMap } from '@/book/prices';
import * as queries from '@/book/queries';

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

jest.mock('@/components/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <div data-testid="DateRangeInput" />,
));

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.spyOn(queries, 'getEarliestDate').mockResolvedValue(DateTime.fromISO('2022-01-01'));
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes empty data to components when loading when not ready', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AddAccountButton');
    expect(AddAccountButton).toHaveBeenLastCalledWith({}, {});

    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        tree: {
          account: {},
          children: [],
          total: expect.any(Money),
        },
      },
      {},
    );

    await screen.findByTestId('DateRangeInput');
    expect(DateRangeInput).toHaveBeenLastCalledWith(
      {
        dateRange: Interval.fromDateTimes(
          DateTime.fromISO('2022-01-01'),
          DateTime.fromISO('2023-01-02'),
        ),
        earliestDate: DateTime.fromISO('2022-01-01'),
        onChange: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('generates tree as expected, no investments', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        getTotal: () => new Money(0, 'EUR'),
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        getTotal: () => new Money(10, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'Bank',
        getTotal: () => new Money(1000, 'USD'),
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
    ];

    jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue({
      getPrice: (from, to, date) => ({
        guid: `${from}.${to}.${date}`,
        value: 0.98,
      }),
    } as PriceDBMap);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(accounts);

    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toHaveBeenCalledWith({
      relations: { splits: { fk_transaction: true } },
      showRoot: true,
    });
    expect(AccountsTable).toBeCalledTimes(2);
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        tree: {
          account: accounts[0],
          total: expect.any(Money),
          children: [
            {
              account: accounts[1],
              total: expect.any(Money),
              children: [
                {
                  account: accounts[2],
                  total: expect.any(Money),
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {},
    );
    expect((AccountsTable as jest.Mock).mock.calls[1][0].tree.total.toString()).toEqual('0.00 EUR');
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].total.toString(),
    ).toEqual('990.00 EUR'); // 1000 USD * 0.98 + 10 EUR
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].children[0].total.toString(),
    ).toEqual('1000.00 USD');
    expect(container).toMatchSnapshot();
  });

  it('generates tree as expected, with investments', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        getTotal: () => new Money(0, 'EUR'),
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Stocks',
        getTotal: () => new Money(0, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'GOOGL',
        getTotal: () => new Money(2, 'GOOGL'),
        commodity: {
          mnemonic: 'GOOGL',
        },
        type: 'STOCK',
        childrenIds: [] as string[],
      } as Account,
    ];

    jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue({
      getPrice: (from, to, date) => ({
        guid: `${from}.${to}.${date}`,
        value: 0.98,
      }),
      getStockPrice: (from, date) => ({
        guid: `${from}.${date}`,
        value: 100,
        currency: {
          mnemonic: 'USD',
        },
      }),
    } as PriceDBMap);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(accounts);

    const { container } = render(
      <swr.SWRConfig value={{ provider: () => new Map() }}>
        <AccountsPage />
      </swr.SWRConfig>,
    );

    await screen.findByTestId('AccountsTable');
    expect(queries.getAccountsWithPath).toHaveBeenCalledWith({
      relations: { splits: { fk_transaction: true } },
      showRoot: true,
    });
    expect(AccountsTable).toBeCalledTimes(3);
    expect(AccountsTable).toHaveBeenLastCalledWith(
      {
        tree: {
          account: accounts[0],
          total: expect.any(Money),
          children: [
            {
              account: accounts[1],
              total: expect.any(Money),
              children: [
                {
                  account: accounts[2],
                  total: expect.any(Money),
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {},
    );
    expect((AccountsTable as jest.Mock).mock.calls[1][0].tree.total.toString()).toEqual('0.00 EUR');
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].total.toString(),
    ).toEqual('196.00 EUR'); // 200 USD * 0.98
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].children[0].total.toString(),
    ).toEqual('200.00 USD'); // 2 GOOGL * 100 USD
    expect(container).toMatchSnapshot();
  });

  it('calls SWR data once', async () => {
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
    expect(queries.getEarliestDate).toBeCalledTimes(1);
  });
});
