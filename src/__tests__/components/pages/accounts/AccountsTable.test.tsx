import React from 'react';
import { render, screen } from '@testing-library/react';

import { AccountsTable } from '@/components/pages/accounts';
import Table from '@/components/Table';
import { Account } from '@/book/entities';
import Money from '@/book/Money';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));
const TableMock = Table as jest.MockedFunction<typeof Table>;

describe('AccountsTable', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates empty Table with expected params', async () => {
    const { container } = render(
      <AccountsTable
        tree={
          {
            account: {},
            monthlyTotals: {},
            total: new Money(0, 'EUR'),
            children: [],
          }
        }
      />,
    );

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      {
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
    const tree = {
      account: {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(100, 'EUR'),
      monthlyTotals: {},
      children: [
        {
          account: {
            guid: 'a1',
            name: 'Assets',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'ASSET',
            childrenIds: [] as string[],
          } as Account,
          total: new Money(70, 'EUR'),
          monthlyTotals: {},
          children: [],
        },
      ],
    };

    render(<AccountsTable tree={tree} />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    expect(Table).toHaveBeenLastCalledWith(
      {
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
        // eslint-disable-next-line testing-library/no-node-access
        data: tree.children,
        initialSort: {
          desc: true,
          id: 'total',
        },
        showHeader: false,
        showPagination: false,
        tdClassName: 'p-2',
        getSubRows: expect.any(Function),
      },
      {},
    );
  });

  it('renders Name column as expected when expandable and not expandded', async () => {
    const tree = {
      account: {
        guid: 'assets',
        name: 'Assets',
        type: 'ASSET',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(100, 'EUR'),
      monthlyTotals: {},
      children: [],
    };

    render(<AccountsTable tree={tree} />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: tree,
          getCanExpand: () => true,
          getIsExpanded: () => false,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Name column as expected when expandable and expanded', async () => {
    const tree = {
      account: {
        guid: 'assets',
        name: 'Assets',
        type: 'ASSET',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(100, 'EUR'),
      monthlyTotals: {},
      children: [],
    };

    render(<AccountsTable tree={tree} />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: tree,
          getCanExpand: () => true,
          getIsExpanded: () => true,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Name column as expected when not expandable', async () => {
    const tree = {
      account: {
        guid: 'assets',
        name: 'Assets',
        type: 'ASSET',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(100, 'EUR'),
      monthlyTotals: {},
      children: [],
    };

    render(<AccountsTable tree={tree} />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: tree,
          getCanExpand: () => false,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    const tree = {
      account: {
        guid: 'assets',
        name: 'Assets',
        type: 'ASSET',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(10, 'EUR'),
      monthlyTotals: {},
      children: [],
    };

    render(<AccountsTable tree={tree} />);

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
          original: tree,
        },
      }),
    );

    await screen.findByText('€10.00');
    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected when INCOME', async () => {
    const tree = {
      account: {
        guid: 'salary',
        name: 'Salary',
        type: 'INCOME',
        childrenIds: ['a1'],
      } as Account,
      total: new Money(-10, 'EUR'),
      monthlyTotals: {},
      children: [],
    };

    render(<AccountsTable tree={tree} />);

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const totalCol = TableMock.mock.calls[0][0].columns[1];

    expect(
      // @ts-ignore
      totalCol.accessorFn({ total: new Money(-10, 'EUR') }),
    ).toEqual(10);

    expect(totalCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      totalCol.cell({
        row: {
          original: tree,
        },
      }),
    );

    await screen.findByText('€10.00');
    expect(container).toMatchSnapshot();
  });
});
