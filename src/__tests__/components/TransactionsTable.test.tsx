import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import { DataSource } from 'typeorm';
import type { LinkProps } from 'next/link';
import crypto from 'crypto';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import Table, { TableProps } from '@/components/Table';
import TransactionsTable from '@/components/TransactionsTable';
import * as dataSourceHooks from '@/hooks/useDataSource';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/components/Table', () => jest.fn(
  (props: TableProps<Split>) => (
    <div data-testid="table">
      <span data-testid="data">{JSON.stringify(props.data)}</span>
      <span data-testid="columns">{JSON.stringify(props.columns)}</span>
    </div>
  ),
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
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('shows empty message', async () => {
    render(
      <TransactionsTable
        accountId=""
        accounts={[]}
      />,
    );

    await screen.findByText('Select an account to see transactions');
  });

  it('creates Table with expected params', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    render(
      <TransactionsTable
        accountId={account1.guid}
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

    await screen.findByText(/random expense/i);

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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    render(
      <TransactionsTable
        accountId={account1.guid}
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

    await screen.findByText(/random expense/i);

    const dateCol = TableMock.mock.calls[1][0].columns[0];

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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    render(
      <TransactionsTable
        accountId={account1.guid}
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

    await screen.findByText(/random expense/i);

    const fromToCol = TableMock.mock.calls[1][0].columns[2];

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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    render(
      <TransactionsTable
        accountId={account1.guid}
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

    await screen.findByText(/random expense/i);

    const amountCol = TableMock.mock.calls[1][0].columns[3];

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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    render(
      <TransactionsTable
        accountId={account1.guid}
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

    await screen.findByText(/random expense/i);

    const totalCol = TableMock.mock.calls[1][0].columns[4];

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
