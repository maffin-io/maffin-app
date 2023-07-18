import React from 'react';
import { render, screen } from '@testing-library/react';

import AccountsTable, { Record } from '@/components/AccountsTable';
import Table from '@/components/Table';
import { PriceDBMap } from '@/book/prices';
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
        accounts={[{} as Account]}
        todayPrices={new PriceDBMap()}
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
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('builds subRows as expected with non investment accounts', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        total: new Money(10, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'Bank',
        total: new Money(1000, 'USD'),
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
    ];

    render(
      <AccountsTable
        accounts={accounts}
        todayPrices={{
          getPrice: (from, to, date) => ({
            guid: `${from}.${to}.${date}`,
            value: 0.98,
          }),
        } as PriceDBMap}
      />,
    );

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
        data: [
          {
            guid: 'a1',
            name: 'Assets',
            type: 'ASSET',
            total: expect.any(Money),
            subRows: [
              {
                guid: 'a2',
                name: 'Bank',
                type: 'BANK',
                total: expect.any(Money),
                subRows: [],
              },
            ],
          },
        ],
        initialSort: {
          desc: true,
          id: 'total',
        },
        showHeader: false,
        showPagination: false,
      },
      {},
    );

    const data = TableMock.mock.calls[0][0].data as Record[];
    expect(data[0].subRows[0].total.toString()).toEqual('1000.00 USD');
    expect(data[0].total.toString()).toEqual('990.00 EUR'); // 1000 USD * 0.98 + 10 EUR
  });

  it('builds subRows as expected with investment accounts', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Stocks',
        total: new Money(0, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'GOOGL',
        total: new Money(2, 'GOOGL'),
        commodity: {
          mnemonic: 'GOOGL',
        },
        type: 'STOCK',
        childrenIds: [] as string[],
      } as Account,
    ];

    render(
      <AccountsTable
        accounts={accounts}
        todayPrices={{
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
        } as PriceDBMap}
      />,
    );

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
        data: [
          {
            guid: 'a1',
            name: 'Stocks',
            type: 'ASSET',
            total: expect.any(Money),
            subRows: [
              {
                guid: 'a2',
                name: 'GOOGL',
                type: 'STOCK',
                total: expect.any(Money),
                subRows: [],
              },
            ],
          },
        ],
        initialSort: {
          desc: true,
          id: 'total',
        },
        showHeader: false,
        showPagination: false,
      },
      {},
    );

    const data = TableMock.mock.calls[0][0].data as Record[];
    expect(data[0].subRows[0].total.toString()).toEqual('200.00 USD'); // 2 GOOGL * 100 USD
    expect(data[0].total.toString()).toEqual('196.00 EUR'); // 200 USD * 0.98
  });

  it('renders Name column as expected', async () => {
    const account = {
      guid: 'a1',
      name: 'Assets',
      total: new Money(10, 'EUR'),
      commodity: {
        mnemonic: 'EUR',
      },
      type: 'ASSET',
      childrenIds: [] as string[],
    } as Account;

    render(
      <AccountsTable
        accounts={[account]}
        todayPrices={new PriceDBMap()}
      />,
    );

    await screen.findByTestId('Table');
    expect(Table).toBeCalledTimes(1);
    const nameCol = TableMock.mock.calls[0][0].columns[0];

    expect(nameCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      nameCol.cell({
        row: {
          original: account,
        },
      }),
    );

    await screen.findByText('Assets');
    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    const account = {
      guid: 'a1',
      name: 'Assets',
      total: new Money(10, 'EUR'),
      commodity: {
        mnemonic: 'EUR',
      },
      type: 'ASSET',
      childrenIds: [] as string[],
    } as Account;

    render(
      <AccountsTable
        accounts={[account]}
        todayPrices={new PriceDBMap()}
      />,
    );

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
          original: account,
        },
      }),
    );

    await screen.findByText('10.00 €');
    expect(container).toMatchSnapshot();
  });
});
