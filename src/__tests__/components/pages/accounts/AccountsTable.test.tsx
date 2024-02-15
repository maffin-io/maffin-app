import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { UseQueryResult } from '@tanstack/react-query';

import { AccountsTable } from '@/components/pages/accounts';
import Table from '@/components/Table';
import { Account } from '@/book/entities';
import Money from '@/book/Money';
import * as apiHook from '@/hooks/api';
import type { MonthlyTotals } from '@/lib/queries';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));
const TableMock = Table as jest.MockedFunction<typeof Table>;

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('AccountsTable', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-01') as DateTime<true>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({ data: undefined } as UseQueryResult<MonthlyTotals>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates empty Table with expected params', async () => {
    const { container } = render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      {
        id: 'accounts-table',
        columns: [
          {
            header: '',
            id: 'name',
            enableSorting: false,
            accessorKey: 'name',
            cell: expect.any(Function),
          },
          {
            header: '',
            id: 'total',
            accessorFn: expect.any(Function),
            cell: expect.any(Function),
          },
        ],
        data: [],
        initialSort: {
          desc: true,
          id: 'total',
        },
        isExpanded: false,
        showHeader: false,
        tdClassName: 'p-2',
        getSubRows: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('creates table with expected params when ASSET', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'root',
            name: 'Root',
            type: 'ROOT',
            childrenIds: ['a1', 'a2'],
          } as Account,
          {
            guid: 'a1',
            name: 'Assets',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'ASSET',
            parentId: 'root',
            childrenIds: [] as string[],
            placeholder: true,
          },
          {
            guid: 'a2',
            name: 'Salary',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'INCOME',
            parentId: 'root',
            childrenIds: [] as string[],
          },
        ] as Account[],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          a1: {
            '01/2023': new Money(100, 'EUR'),
            '02/2023': new Money(200, 'EUR'), // Will be ignored
          },
          a2: {
            '01/2023': new Money(-100, 'EUR'),
          },
        } as MonthlyTotals,
      } as UseQueryResult<MonthlyTotals>,
    );

    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    expect(Table).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: [
          {
            account: {
              guid: 'a1',
              name: 'Assets',
              type: 'ASSET',
              parentId: 'root',
              description: 'description',
              commodity: {
                mnemonic: 'EUR',
              },
              childrenIds: [],
              placeholder: true,
            },
            leaves: [],
            total: expect.any(Money),
          },
          {
            account: {
              guid: 'a2',
              name: 'Salary',
              type: 'INCOME',
              parentId: 'root',
              commodity: {
                mnemonic: 'EUR',
              },
              childrenIds: [],
            },
            leaves: [],
            total: expect.any(Money),
          },
        ],
      }),
      {},
    );

    expect((Table as jest.Mock).mock.calls[0][0].data[0].total.toString()).toEqual('100.00 EUR');
    expect((Table as jest.Mock).mock.calls[0][0].data[1].total.toString()).toEqual('100.00 EUR');
  });

  it('creates table with expected params when EXPENSE', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'root',
            name: 'Root',
            type: 'ROOT',
            childrenIds: ['a1'],
          } as Account,
          {
            guid: 'a1',
            name: 'Expense',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'EXPENSE',
            parentId: 'root',
            childrenIds: [] as string[],
            placeholder: true,
          },
        ] as Account[],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          a1: {
            '12/2022': new Money(100, 'EUR'),
            '01/2023': new Money(100, 'EUR'),
            '02/2023': new Money(100, 'EUR'), // will be ignored
          },
        } as MonthlyTotals,
      } as UseQueryResult<MonthlyTotals>,
    );

    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    expect(Table).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: [
          {
            account: {
              guid: 'a1',
              name: 'Expense',
              type: 'EXPENSE',
              parentId: 'root',
              description: 'description',
              commodity: {
                mnemonic: 'EUR',
              },
              childrenIds: [],
              placeholder: true,
            },
            leaves: [],
            total: expect.any(Money),
          },
        ],
      }),
      {},
    );

    expect((Table as jest.Mock).mock.calls[0][0].data[0].total.toString()).toEqual('200.00 EUR');
  });

  it('ignores hidden accounts', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'root',
            name: 'Root',
            type: 'ROOT',
            childrenIds: ['a1'],
          } as Account,
          {
            guid: 'a1',
            name: 'Assets',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'ASSET',
            childrenIds: [] as string[],
            hidden: true,
          },
        ] as Account[],
      } as UseQueryResult<Account[]>,
    );

    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    expect(Table).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: [],
      }),
      {},
    );
  });

  it('renders Name column as expected when expandable and not expandded', async () => {
    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: {
            account: {
              guid: 'assets',
              name: 'Assets',
              type: 'ASSET',
              childrenIds: ['a1'],
            } as Account,
            total: new Money(100, 'EUR'),
            leaves: [],
          },
          getCanExpand: () => true,
          getIsExpanded: () => false,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Name column as expected when expandable and expanded', async () => {
    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: {
            account: {
              guid: 'assets',
              name: 'Assets',
              type: 'ASSET',
              childrenIds: ['a1'],
            } as Account,
            total: new Money(100, 'EUR'),
            monthlyTotals: {},
            children: [],
          },
          getCanExpand: () => true,
          getIsExpanded: () => true,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Name column as expected when not expandable', async () => {
    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: {
            account: {
              guid: 'assets',
              name: 'Assets',
              type: 'ASSET',
              childrenIds: ['a1'],
              placeholder: true,
            } as Account,
            total: new Money(100, 'EUR'),
            monthlyTotals: {},
            children: [],
          },
          getCanExpand: () => false,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const totalCol = TableMock.mock.calls[0][0].columns[1];

    expect(
      // @ts-ignore
      totalCol.accessorFn({ total: new Money(10, 'EUR') }),
    ).toEqual(10);

    expect(totalCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      totalCol.cell({
        row: {
          original: {
            account: {
              guid: 'assets',
              name: 'Assets',
              type: 'ASSET',
              childrenIds: ['a1'],
            } as Account,
            total: new Money(10, 'EUR'),
            children: [],
          },
        },
      }),
    );

    await screen.findByText('€10.00');
    expect(container).toMatchSnapshot();
  });
});
