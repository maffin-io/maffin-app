import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import { DateTime, Interval } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import DateRangeInput from '@/components/DateRangeInput';
import NetWorthRadial from '@/components/pages/accounts/NetWorthRadial';
import { PriceDBMap } from '@/book/prices';
import * as apiHook from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
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

jest.mock('@/components/pages/accounts/NetWorthRadial', () => jest.fn(
  () => <div data-testid="NetWorthRadial" />,
));

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
    jest.spyOn(apiHook, 'default').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes empty data to components when loading when not ready', async () => {
    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'default')
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: [] } as SWRResponse)
      .mockReturnValueOnce({ data: undefined } as SWRResponse)
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: [] } as SWRResponse)
      .mockReturnValueOnce({ data: undefined } as SWRResponse);
    const { container } = render(<AccountsPage />);

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

    await screen.findByTestId('NetWorthRadial');
    expect(NetWorthRadial).toHaveBeenLastCalledWith(
      {
        tree: {
          account: {},
          children: [],
          total: expect.any(Money),
        },
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

    const todayQuotes = {
      getPrice: (from, to, date) => ({
        guid: `${from}.${to}.${date}`,
        value: 0.98,
      }),
    } as PriceDBMap;

    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'default')
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse)
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse);

    const { container } = render(<AccountsPage />);

    const expectedTree = {
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
    };
    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(2);
    expect(AccountsTable).toHaveBeenLastCalledWith(expectedTree, {});
    expect((AccountsTable as jest.Mock).mock.calls[1][0].tree.total.toString()).toEqual('0.00 EUR');
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].total.toString(),
    ).toEqual('990.00 EUR'); // 1000 USD * 0.98 + 10 EUR
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].children[0].total.toString(),
    ).toEqual('1000.00 USD');

    expect(NetWorthRadial).toHaveBeenLastCalledWith(expectedTree, {});

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

    const todayQuotes = {
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
    } as PriceDBMap;

    const date = DateTime.fromISO('2022-01-01');
    jest.spyOn(apiHook, 'default')
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse)
      .mockReturnValueOnce({ data: date } as SWRResponse)
      .mockReturnValueOnce({ data: accounts } as SWRResponse)
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse);

    const { container } = render(<AccountsPage />);

    const expectedTree = {
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
    };
    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(2);
    expect(AccountsTable).toHaveBeenLastCalledWith(expectedTree, {});
    expect((AccountsTable as jest.Mock).mock.calls[1][0].tree.total.toString()).toEqual('0.00 EUR');
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].total.toString(),
    ).toEqual('196.00 EUR'); // 200 USD * 0.98
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      (AccountsTable as jest.Mock).mock.calls[1][0].tree.children[0].children[0].total.toString(),
    ).toEqual('200.00 USD'); // 2 GOOGL * 100 USD

    expect(NetWorthRadial).toHaveBeenLastCalledWith(expectedTree, {});

    expect(container).toMatchSnapshot();
  });
});
