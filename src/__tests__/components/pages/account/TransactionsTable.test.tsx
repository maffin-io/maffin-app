import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import type { LinkProps } from 'next/link';
import type { SWRResponse } from 'swr';

import {
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import Table from '@/components/Table';
import { TransactionsTable } from '@/components/pages/account';
import FormButton from '@/components/buttons/FormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import type { AccountsMap } from '@/types/book';
import * as apiHook from '@/hooks/api';

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

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/transaction/TransactionForm', () => jest.fn(
  () => <div data-testid="TransactionForm" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TransactionsTable', () => {
  let eur: Commodity;
  let accounts: AccountsMap;
  let split: Split;

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
      },
      account_guid_2: {
        guid: 'account_guid_2',
        name: 'expense',
        type: 'EXPENSE',
        path: 'Expenses:expense',
        commodity: eur,
      },
    };

    split = new Split();
    split.fk_account = accounts.account_guid_1;
    split.guid = 'split_guid_1';
    split.value = 100;
    split.quantity = 100;

    const splitA = new Split();
    splitA.fk_account = split.fk_account;
    splitA.guid = split.guid;
    splitA.value = split.value;
    splitA.quantity = split.quantity;

    const splitB = new Split();
    splitB.fk_account = accounts.account_guid_2;
    splitB.guid = 'splits_guid_2';
    splitB.value = -100;
    splitB.quantity = -100;

    split.fk_transaction = {
      guid: 'tx_guid',
      description: 'random expense',
      date: DateTime.fromISO('2023-01-01'),
      fk_currency: {
        mnemonic: 'EUR',
      } as Commodity,
      splits: [splitA, splitB],
    } as Transaction;

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: accounts } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: [split] } as SWRResponse);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('creates empty Table with expected params', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);

    render(<TransactionsTable account={accounts.account_guid_1} />);

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      {
        id: 'transactions-table',
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
        data: [],
      },
      {},
    );
  });

  it('creates Table with expected params', async () => {
    render(
      <TransactionsTable
        account={accounts.account_guid_1}
      />,
    );

    await screen.findByTestId('Table');

    expect(Table).toHaveBeenLastCalledWith({
      id: 'transactions-table',
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
      data: [split],
    }, {});
  });

  it('renders Date column as expected', async () => {
    render(<TransactionsTable account={accounts.account_guid_1} />);

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
          original: split,
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders FromTo column as expected', async () => {
    render(<TransactionsTable account={accounts.account_guid_1} />);

    await screen.findByTestId('Table');
    const fromToCol = TableMock.mock.calls[0][0].columns[2];

    expect(fromToCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      fromToCol.cell({
        row: {
          original: split,
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Amount column as expected', async () => {
    render(<TransactionsTable account={accounts.account_guid_1} />);

    await screen.findByTestId('Table');
    const amountCol = TableMock.mock.calls[0][0].columns[3];

    expect(amountCol.cell).not.toBeUndefined();
    let { container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: split,
        },
      }),
    );

    expect(container).toMatchSnapshot();

    ({ container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: split,
        },
      }),
    ));

    expect(container).toMatchSnapshot();
  });

  it('renders Total column as expected', async () => {
    render(
      <TransactionsTable
        account={accounts.account_guid_1}
      />,
    );

    await screen.findByTestId('Table');
    const totalCol = TableMock.mock.calls[0][0].columns[4];

    expect(totalCol.cell).not.toBeUndefined();

    const row1 = {
      original: {
        guid: 'split0',
        quantity: 100,
        account: accounts.account_guid_1,
      },
    };
    const row2 = {
      original: {
        guid: 'split1',
        quantity: 150,
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
        account={accounts.account_guid_1}
      />,
    );

    await screen.findByTestId('Table');
    const actionsCol = TableMock.mock.calls[0][0].columns[5];

    expect(actionsCol.cell).not.toBeUndefined();

    const { container } = render(
      // @ts-ignore
      actionsCol.cell({
        row: {
          original: split,
        },
      }),
    );

    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        className: 'link',
        id: 'edit-tx',
        modalTitle: 'Edit transaction',
      }),
      {},
    );
    expect(TransactionForm).toHaveBeenNthCalledWith(
      1,
      {
        action: 'update',
        defaultValues: {
          ...split.transaction,
          date: '2023-01-01',
          splits: split.transaction.splits.map(s => ({
            ...s,
            value: s.value,
            quantity: s.quantity,
          })),
        },
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        className: 'link',
        id: 'delete-tx',
        modalTitle: 'Confirm you want to remove this transaction',
      }),
      {},
    );
    expect(TransactionForm).toHaveBeenNthCalledWith(
      2,
      {
        action: 'delete',
        defaultValues: {
          ...split.transaction,
          date: '2023-01-01',
          splits: split.transaction.splits.map(s => ({
            ...s,
            value: s.value,
            quantity: s.quantity,
          })),
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
