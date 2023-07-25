import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import { DataSource } from 'typeorm';
import type { LinkProps } from 'next/link';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import Table from '@/components/Table';
import TransactionsTable from '@/components/TransactionsTable';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));
const TableMock = Table as jest.MockedFunction<typeof Table>;

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

describe('TransactionsTable', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
  let account1: Account;
  let account2: Account;
  let transaction: Transaction;
  let splits: Split[];

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    account1 = await Account.create({
      guid: 'account_guid_1',
      name: 'bank',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    account2 = await Account.create({
      guid: 'account_guid_2',
      name: 'expense',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    transaction = await Transaction.create({
      guid: 'tx_guid',
      description: 'random expense',
      fk_currency: eur,
      date: DateTime.fromISO('2023-01-01'),
      splits: [
        {
          guid: 'split_guid_1',
          valueNum: -10,
          valueDenom: 100,
          quantityNum: -15,
          quantityDenom: 100,
          fk_account: account1,
        },
        {
          guid: 'split_guid_2',
          valueNum: 10,
          valueDenom: 100,
          quantityNum: 15,
          quantityDenom: 100,
          fk_account: account2,
        },
      ],
    }).save();

    splits = await Split.find({
      where: {
        fk_account: {
          guid: account1.guid,
        },
      },
      relations: {
        fk_transaction: {
          splits: {
            fk_account: true,
          },
        },
        fk_account: true,
      },
      order: {
        fk_transaction: {
          date: 'DESC',
        },
        quantityNum: 'ASC',
      },
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await datasource.destroy();
  });

  it('creates Table with expected params', async () => {
    render(
      <TransactionsTable
        splits={splits}
        accounts={[
          {
            ...account1,
            path: 'Assets:bank',
          } as Account,
          {
            ...account2,
            path: 'Expenses:expense',
          } as Account,
        ]}
      />,
    );

    await screen.findByTestId('Table');

    expect(Table).toHaveBeenLastCalledWith({
      columns: [
        {
          header: 'Date',
          id: 'date',
          enableSorting: false,
          accessorFn: expect.any(Function),
          cell: expect.any(Function),
        },
        {
          header: 'Description',
          enableSorting: false,
          accessorFn: expect.any(Function),
        },
        {
          header: 'From/To',
          enableSorting: false,
          cell: expect.any(Function),
        },
        {
          accessorKey: 'value',
          header: 'Amount',
          enableSorting: false,
          cell: expect.any(Function),
        },
        {
          header: 'Total',
          enableSorting: false,
          cell: expect.any(Function),
        },
      ],
      data: [
        {
          ...transaction.splits[0],
          fk_account: {
            guid: 'account_guid_1',
            name: 'bank',
            type: 'ASSET',
            fk_commodity: eur,
            childrenIds: [],
          },
          fk_transaction: {
            ...transaction,
            splits: [
              {
                action: '',
                fk_account: {
                  guid: account1.guid,
                  name: 'bank',
                  type: 'ASSET',
                  fk_commodity: eur,
                  childrenIds: [],
                },
                guid: 'split_guid_1',
                quantityDenom: 100,
                quantityNum: -15,
                valueDenom: 100,
                valueNum: -10,
              },
              {
                action: '',
                fk_account: {
                  guid: account2.guid,
                  name: 'expense',
                  type: 'EXPENSE',
                  fk_commodity: eur,
                  childrenIds: [],
                },
                guid: 'split_guid_2',
                quantityDenom: 100,
                quantityNum: 15,
                valueDenom: 100,
                valueNum: 10,
              },
            ],
          },
        },
      ],
    }, {});
  });

  it('renders Date column as expected', async () => {
    render(
      <TransactionsTable
        splits={splits}
        accounts={[
          {
            ...account1,
            path: 'Assets:bank',
          } as Account,
          {
            ...account2,
            path: 'Expenses:expense',
          } as Account,
        ]}
      />,
    );

    await screen.findByTestId('Table');
    const dateCol = TableMock.mock.calls[0][0].columns[0];

    expect(
      // @ts-ignore
      dateCol.accessorFn({ transaction: { date: DateTime.fromISO('2023-01-01', { zone: 'utc' }) } }),
    ).toEqual(1672531200000);

    expect(dateCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      dateCol.cell({
        row: {
          original: {
            transaction,
          },
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders FromTo column as expected', async () => {
    render(
      <TransactionsTable
        splits={splits}
        accounts={[
          {
            ...account1,
            path: 'Assets:bank',
          } as Account,
          {
            ...account2,
            path: 'Expenses:expense',
          } as Account,
        ]}
      />,
    );

    await screen.findByTestId('Table');
    const fromToCol = TableMock.mock.calls[0][0].columns[2];

    expect(fromToCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      fromToCol.cell({
        row: {
          original: {
            transaction: {
              ...transaction,
              splits: [
                {
                  action: '',
                  account: {
                    guid: account1.guid,
                    name: 'bank',
                    type: 'ASSET',
                    fk_commodity: eur,
                  },
                  guid: expect.any(String),
                  quantityDenom: 100,
                  quantityNum: 15,
                  valueDenom: 100,
                  valueNum: 10,
                },
                {
                  action: '',
                  account: {
                    guid: account2.guid,
                    name: 'expense',
                    type: 'EXPENSE',
                    fk_commodity: eur,
                  },
                  guid: expect.any(String),
                  quantityDenom: 100,
                  quantityNum: -15,
                  valueDenom: 100,
                  valueNum: -10,
                },
              ],
            },
            account: account1,
          },
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Amount column as expected', async () => {
    render(
      <TransactionsTable
        splits={splits}
        accounts={[
          {
            ...account1,
            path: 'Assets:bank',
          } as Account,
          {
            ...account2,
            path: 'Expenses:expense',
          } as Account,
        ]}
      />,
    );

    await screen.findByTestId('Table');
    const amountCol = TableMock.mock.calls[0][0].columns[3];

    expect(amountCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: {
            quantity: 100,
            account: account1,
          },
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    render(
      <TransactionsTable
        splits={splits}
        accounts={[
          {
            ...account1,
            path: 'Assets:bank',
          } as Account,
          {
            ...account2,
            path: 'Expenses:expense',
          } as Account,
        ]}
      />,
    );

    await screen.findByTestId('Table');
    const totalCol = TableMock.mock.calls[0][0].columns[4];

    expect(totalCol.cell).not.toBeUndefined();

    const row1 = {
      original: {
        guid: 'split0',
        quantity: 100,
        account: account1,
      },
    };
    const row2 = {
      original: {
        guid: 'split1',
        quantity: 150,
        account: account1,
      },
    };
    const { container } = render(
      // @ts-ignore
      totalCol.cell({
        row: row1,
        table: {
          getCoreRowModel: () => ({ rows: [row1, row2] }),
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });
});
