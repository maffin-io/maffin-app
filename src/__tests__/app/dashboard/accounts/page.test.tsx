import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import AccountsPage from '@/app/dashboard/accounts/page';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import DateRangeInput from '@/components/DateRangeInput';
import { NetWorthPie, NetWorthHistogram, MonthlyTotalHistogram } from '@/components/pages/accounts';
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

jest.mock('@/components/pages/accounts/NetWorthPie', () => jest.fn(
  () => <div data-testid="NetWorthPie" />,
));

jest.mock('@/components/pages/accounts/NetWorthHistogram', () => jest.fn(
  () => <div data-testid="NetWorthHistogram" />,
));

jest.mock('@/components/pages/accounts/MonthlyTotalHistogram', () => jest.fn(
  () => <div data-testid="MonthlyTotalHistogram" />,
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
          monthlyTotals: {},
          total: expect.any(Money),
        },
      },
      {},
    );

    await screen.findByTestId('DateRangeInput');
    expect(DateRangeInput).toHaveBeenLastCalledWith(
      {
        asSingle: true,
        dateRange: {
          start: DateTime.fromISO('2023-01-02'),
          end: DateTime.fromISO('2023-01-02'),
        },
        earliestDate: DateTime.fromISO('2022-01-01'),
        onChange: expect.any(Function),
      },
      {},
    );

    await screen.findByTestId('NetWorthPie');
    expect(NetWorthPie).toHaveBeenLastCalledWith(
      {
        tree: {
          account: {},
          children: [],
          monthlyTotals: {},
          total: expect.any(Money),
        },
      },
      {},
    );

    await screen.findByTestId('NetWorthHistogram');
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        tree: {
          account: {},
          children: [],
          monthlyTotals: {},
          total: expect.any(Money),
        },
        selectedDate: DateTime.fromISO('2023-01-02'),
        startDate: DateTime.fromISO('2022-01-01'),
      },
      {},
    );

    expect(screen.getAllByTestId('MonthlyTotalHistogram')).toHaveLength(2);
    expect(MonthlyTotalHistogram).toBeCalledTimes(2);
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        tree: undefined,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        tree: undefined,
        selectedDate: DateTime.fromISO('2023-01-02'),
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
        getMonthlyTotals: () => ({}),
        childrenIds: ['a1', 'a3', 'a5'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        getTotal: () => new Money(10, 'EUR'),
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(7, 'EUR'),
          'Feb/23': new Money(3, 'EUR'),
        })) as typeof Account.prototype.getMonthlyTotals,
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
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(700, 'USD'),
          'Feb/23': new Money(300, 'USD'),
        })) as typeof Account.prototype.getMonthlyTotals,
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a3',
        name: 'Expenses',
        getTotal: () => new Money(1000, 'EUR'),
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(700, 'EUR'),
          'Feb/23': new Money(300, 'EUR'),
        })) as typeof Account.prototype.getMonthlyTotals,
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        childrenIds: ['a4'] as string[],
      } as Account,
      {
        guid: 'a4',
        name: 'Groceries',
        getTotal: () => new Money(1000, 'EUR'),
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(700, 'EUR'),
          'Feb/23': new Money(300, 'EUR'),
        })) as typeof Account.prototype.getMonthlyTotals,
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'EXPENSE',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a5',
        name: 'Income',
        getTotal: () => new Money(2000, 'EUR'),
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(1000, 'EUR'),
          'Feb/23': new Money(1000, 'EUR'),
        })) as typeof Account.prototype.getMonthlyTotals,
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        childrenIds: ['a6'] as string[],
      } as Account,
      {
        guid: 'a6',
        name: 'Salary',
        getTotal: () => new Money(1000, 'EUR'),
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(1000, 'EUR'),
          'Feb/23': new Money(1000, 'EUR'),
        })) as typeof Account.prototype.getMonthlyTotals,
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
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
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse);

    render(<AccountsPage />);

    const expectedTree = {
      account: accounts[0],
      total: expect.any(Money),
      monthlyTotals: {},
      children: [
        {
          account: accounts[1],
          total: expect.any(Money),
          monthlyTotals: {
            'Jan/23': expect.any(Money),
            'Feb/23': expect.any(Money),
          },
          children: [
            {
              account: accounts[2],
              total: expect.any(Money),
              monthlyTotals: {
                'Jan/23': expect.any(Money),
                'Feb/23': expect.any(Money),
              },
              children: [],
            },
          ],
        },
        {
          account: accounts[3],
          total: expect.any(Money),
          monthlyTotals: {
            'Jan/23': expect.any(Money),
            'Feb/23': expect.any(Money),
          },
          children: [
            {
              account: accounts[4],
              total: expect.any(Money),
              monthlyTotals: {
                'Jan/23': expect.any(Money),
                'Feb/23': expect.any(Money),
              },
              children: [],
            },
          ],
        },
        {
          account: accounts[5],
          total: expect.any(Money),
          monthlyTotals: {
            'Jan/23': expect.any(Money),
            'Feb/23': expect.any(Money),
          },
          children: [
            {
              account: accounts[6],
              total: expect.any(Money),
              monthlyTotals: {
                'Jan/23': expect.any(Money),
                'Feb/23': expect.any(Money),
              },
              children: [],
            },
          ],
        },
      ],
    };
    await screen.findByTestId('AccountsTable');
    expect(AccountsTable).toBeCalledTimes(1);
    expect(AccountsTable).toHaveBeenLastCalledWith({ tree: expectedTree }, {});
    expect(NetWorthPie).toHaveBeenLastCalledWith({ tree: expectedTree }, {});
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        tree: expectedTree,
        startDate: date,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      1,
      {
        title: 'Income',
        // eslint-disable-next-line testing-library/no-node-access
        tree: expectedTree.children[2],
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );
    expect(MonthlyTotalHistogram).toHaveBeenNthCalledWith(
      2,
      {
        title: 'Expenses',
        // eslint-disable-next-line testing-library/no-node-access
        tree: expectedTree.children[1],
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    const resultTree = (AccountsTable as jest.Mock).mock.calls[0][0].tree;
    expect(resultTree.total.toString()).toEqual('0.00 EUR');

    /* eslint-disable testing-library/no-node-access */
    expect(resultTree.children[0].total.toString()).toEqual('990.00 EUR'); // 1000 USD * 0.98 + 10 EUR
    expect(
      resultTree.children[0].monthlyTotals['Jan/23'].toString(),
    ).toEqual('693.00 EUR'); // 700 USD * 0.98 + 7 EUR
    expect(
      resultTree.children[0].monthlyTotals['Feb/23'].toString(),
    ).toEqual('297.00 EUR'); // 300 USD * 0.98 + 3 EUR

    expect(resultTree.children[0].children[0].total.toString()).toEqual('1000.00 USD');
    expect(
      resultTree.children[0].children[0].monthlyTotals['Jan/23'].toString(),
    ).toEqual('686.00 EUR'); // 700 USD * 0.98
    expect(
      resultTree.children[0].children[0].monthlyTotals['Feb/23'].toString(),
    ).toEqual('294.00 EUR'); // 300 USD * 0.98
    /* eslint-enable testing-library/no-node-access */
  });

  it('generates tree as expected, with investments', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        getTotal: () => new Money(0, 'EUR'),
        getMonthlyTotals: () => ({}),
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Stocks',
        getTotal: () => new Money(0, 'EUR'),
        getMonthlyTotals: () => ({}),
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
        getMonthlyTotals: (() => ({
          'Jan/23': new Money(1, 'GOOGL'),
          'Feb/23': new Money(1, 'GOOGL'),
        })) as typeof Account.prototype.getMonthlyTotals,
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
      .mockReturnValueOnce({ data: todayQuotes } as SWRResponse);

    render(<AccountsPage />);

    const expectedTree = {
      account: accounts[0],
      total: expect.any(Money),
      monthlyTotals: {},
      children: [
        {
          account: accounts[1],
          total: expect.any(Money),
          monthlyTotals: {
            'Jan/23': expect.any(Money),
            'Feb/23': expect.any(Money),
          },
          children: [
            {
              account: accounts[2],
              total: expect.any(Money),
              monthlyTotals: {
                'Jan/23': expect.any(Money),
                'Feb/23': expect.any(Money),
              },
              children: [],
            },
          ],
        },
      ],
    };
    expect(AccountsTable).toBeCalledTimes(1);
    expect(AccountsTable).toHaveBeenLastCalledWith({ tree: expectedTree }, {});
    expect(NetWorthPie).toHaveBeenLastCalledWith({ tree: expectedTree }, {});
    expect(NetWorthHistogram).toHaveBeenLastCalledWith(
      {
        tree: expectedTree,
        startDate: date,
        selectedDate: DateTime.fromISO('2023-01-02'),
      },
      {},
    );

    const resultTree = (AccountsTable as jest.Mock).mock.calls[0][0].tree;
    expect(resultTree.total.toString()).toEqual('0.00 EUR');

    /* eslint-disable testing-library/no-node-access */
    expect(resultTree.children[0].total.toString()).toEqual('196.00 EUR'); // 200 USD * 0.98
    expect(
      resultTree.children[0].monthlyTotals['Jan/23'].toString(),
    ).toEqual('98.00 EUR'); // 100 USD * 0.98
    expect(
      resultTree.children[0].monthlyTotals['Feb/23'].toString(),
    ).toEqual('98.00 EUR'); // 100 USD * 0.98
    expect(resultTree.children[0].children[0].total.toString()).toEqual('200.00 USD'); // 2 GOOGL * 100 USD
    expect(
      resultTree.children[0].children[0].monthlyTotals['Jan/23'].toString(),
    ).toEqual('98.00 EUR'); // 100 USD * 0.98
    expect(
      resultTree.children[0].children[0].monthlyTotals['Feb/23'].toString(),
    ).toEqual('98.00 EUR'); // 100 USD * 0.98
    /* eslint-enable testing-library/no-node-access */
  });
});
