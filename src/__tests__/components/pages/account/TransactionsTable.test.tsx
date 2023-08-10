import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import type { LinkProps } from 'next/link';
import { BiEdit, BiXCircle } from 'react-icons/bi';
import type { AccountsMap } from '@/types/book';

import { Commodity } from '@/book/entities';
import Table from '@/components/Table';
import { TransactionsTable } from '@/components/pages/account';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));
const TableMock = Table as jest.MockedFunction<typeof Table>;

jest.mock('@/components/buttons/TransactionFormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="TransactionFormButton">
      {props.children}
    </div>
  ),
));

describe('TransactionsTable', () => {
  let eur: Commodity;
  let accounts: AccountsMap;

  beforeEach(async () => {
    eur = {
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    } as Commodity;

    accounts = {
      account_guid_1: {
        guid: 'account_guid_1',
        name: 'bank',
        type: 'ASSET',
        commodity: eur,
        path: 'Assets:bank',
        splits: [
          {
            guid: 'split_guid_1',
            value: -100,
            quantity: -100,
            accountId: 'account_guid_1',
            transaction: {
              guid: 'tx_guid',
              description: 'random expense',
              date: DateTime.fromISO('2023-01-01'),
              currency: eur,
            },
          },
        ],
      },
      account_guid_2: {
        guid: 'account_guid_2',
        name: 'expense',
        type: 'EXPENSE',
        path: 'Expenses:expense',
        commodity: eur,
        splits: [
          {
            guid: 'split_guid_2',
            value: 100,
            quantity: 100,
            accountId: 'account_guid_2',
            transaction: {
              guid: 'tx_guid',
              description: 'random expense',
              date: DateTime.fromISO('2023-01-01'),
              currency: eur,
            },
          },
        ],
      },
    };
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('creates Table with expected params', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
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
        {
          header: 'Actions',
          enableSorting: false,
          cell: expect.any(Function),
        },
      ],
      data: accounts.account_guid_1.splits,
    }, {});
  });

  it('renders Date column as expected', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
      />,
    );

    await screen.findByTestId('Table');
    const dateCol = TableMock.mock.calls[0][0].columns[0];

    expect(
      // @ts-ignore
      dateCol.accessorFn({ transaction: { date: DateTime.fromISO('2023-01-01') } }),
    ).toEqual(1672531200000);

    expect(dateCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      dateCol.cell({
        row: {
          original: accounts.account_guid_1.splits[0],
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders FromTo column as expected', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
      />,
    );

    await screen.findByTestId('Table');
    const fromToCol = TableMock.mock.calls[0][0].columns[2];

    expect(fromToCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      fromToCol.cell({
        row: {
          original: accounts.account_guid_1.splits[0],
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Amount column as expected', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
      />,
    );

    await screen.findByTestId('Table');
    const amountCol = TableMock.mock.calls[0][0].columns[3];

    expect(amountCol.cell).not.toBeUndefined();
    let { container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: accounts.account_guid_2.splits[0],
        },
      }),
    );

    expect(container).toMatchSnapshot();

    ({ container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: accounts.account_guid_1.splits[0],
        },
      }),
    ));

    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
      />,
    );

    await screen.findByTestId('Table');
    const totalCol = TableMock.mock.calls[0][0].columns[4];

    expect(totalCol.cell).not.toBeUndefined();

    const row1 = {
      original: {
        guid: 'split0',
        quantity: 100,
        accountId: 'account_guid_1',
        account: accounts.account_guid_1,
      },
    };
    const row2 = {
      original: {
        guid: 'split1',
        quantity: 150,
        accountId: 'account_guid_1',
        account: accounts.account_guid_1,
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

  it('renders Actions column as expected', async () => {
    render(
      <TransactionsTable
        splits={accounts.account_guid_1.splits}
        accounts={accounts}
      />,
    );

    await screen.findByTestId('Table');
    const actionsCol = TableMock.mock.calls[0][0].columns[5];

    expect(actionsCol.cell).not.toBeUndefined();

    const { container } = render(
      // @ts-ignore
      actionsCol.cell({
        row: {
          original: accounts.account_guid_2.splits[0],
        },
      }),
    );

    expect(TransactionFormButton).toBeCalledTimes(2);
    expect(TransactionFormButton).toHaveBeenNthCalledWith(
      1,
      {
        action: 'update',
        className: 'link',
        children: <BiEdit className="flex" />,
        defaultValues: {
          ...accounts.account_guid_2.splits[0].transaction,
          date: '2023-01-01',
          fk_currency: eur,
        },
      },
      {},
    );
    expect(TransactionFormButton).toHaveBeenNthCalledWith(
      2,
      {
        action: 'delete',
        className: 'link',
        children: <BiXCircle className="flex" />,
        defaultValues: {
          ...accounts.account_guid_2.splits[0].transaction,
          date: '2023-01-01',
          fk_currency: eur,
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
