import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import { AccountsTable } from '@/components/pages/accounts';
import Table from '@/components/Table';
import { Account } from '@/book/entities';
import Money from '@/book/Money';
import * as apiHook from '@/hooks/api';

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
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue({ data: undefined } as SWRResponse);
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
        showPagination: false,
        tdClassName: 'p-2',
        getSubRows: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('creates table with expected params', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: {
          root: {
            guid: 'root',
            name: 'Root',
            type: 'ROOT',
            childrenIds: ['a1', 'a2'],
          } as Account,
          a1: {
            guid: 'a1',
            name: 'Assets',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'ASSET',
            childrenIds: [] as string[],
            placeholder: true,
          },
          a2: {
            guid: 'a2',
            name: 'Salary',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'INCOME',
            childrenIds: [] as string[],
          },
        },
      } as SWRResponse,
    );
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          a1: {
            '01/2023': new Money(100, 'EUR'),
          },
          a2: {
            '01/2023': new Money(-100, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(<AccountsTable />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
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
        data: [
          {
            account: {
              guid: 'a1',
              name: 'Assets',
              type: 'ASSET',
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
              commodity: {
                mnemonic: 'EUR',
              },
              childrenIds: [],
            },
            leaves: [],
            total: expect.any(Money),
          },
        ],
        initialSort: {
          desc: true,
          id: 'total',
        },
        isExpanded: false,
        showHeader: false,
        showPagination: false,
        tdClassName: 'p-2',
        getSubRows: expect.any(Function),
      },
      {},
    );

    expect((Table as jest.Mock).mock.calls[0][0].data[0].total.toString()).toEqual('100.00 EUR');
    expect((Table as jest.Mock).mock.calls[0][0].data[1].total.toString()).toEqual('100.00 EUR');
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
