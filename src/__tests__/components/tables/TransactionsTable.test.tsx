import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import * as query from '@tanstack/react-query';
import type { LinkProps } from 'next/link';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import Table from '@/components/tables/Table';
import { TransactionsTable } from '@/components/tables';
import FormButton from '@/components/buttons/FormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import * as apiHook from '@/hooks/api';

jest.mock('@tanstack/react-query');
jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

jest.mock('@/components/tables/Table', () => jest.fn(
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
  let account: Account;
  let split: Split;

  beforeEach(async () => {
    eur = {
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    } as Commodity;

    account = {
      guid: 'account_guid_1',
      name: 'bank',
      parentId: 'root',
      type: 'ASSET',
      commodity: eur,
      path: 'Assets:bank',
    } as Account;

    split = new Split();
    split.accountId = 'account_guid_1';
    split.guid = 'split_guid_1';
    split.value = 100;
    split.quantity = 100;
    split.txId = 'tx_guid';
    split.balance = 250;
    split.fk_transaction = {
      date: DateTime.fromISO('2023-01-01'),
    } as Transaction;

    jest.spyOn(apiHook, 'useSplitsCount').mockReturnValue({ data: 1 } as UseQueryResult<number>);
    jest.spyOn(apiHook, 'useSplitsPagination').mockReturnValue(
      { data: [split] } as UseQueryResult<Split[]>,
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('creates empty Table with expected params', async () => {
    jest.spyOn(apiHook, 'useSplitsCount').mockReturnValue({ data: undefined } as UseQueryResult<number>);
    jest.spyOn(apiHook, 'useSplitsPagination').mockReturnValue(
      { data: undefined } as UseQueryResult<Split[]>,
    );

    render(<TransactionsTable account={account} />);

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      {
        id: 'transactions-table',
        manualPagination: true,
        onPaginationChange: expect.any(Function),
        pageCount: 0,
        showPagination: true,
        state: {
          pagination: {
            pageIndex: 0,
            pageSize: 10,
          },
        },
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
            cell: expect.any(Function),
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
            header: 'Balance',
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
    expect(apiHook.useSplitsCount).toBeCalledWith('account_guid_1');
    expect(apiHook.useSplitsPagination).toBeCalledWith('account_guid_1', { pageIndex: 0, pageSize: 10 });
  });

  it('creates Table with expected params', async () => {
    render(
      <TransactionsTable
        account={account}
      />,
    );

    await screen.findByTestId('Table');

    expect(Table).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'transactions-table',
      pageCount: 1,
      data: [split],
    }), {});
  });

  it('renders Date column as expected', async () => {
    render(<TransactionsTable account={account} />);

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

  it('renders Description column as expected', async () => {
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: {
        guid: 'tx_guid',
        description: 'Tx description',
      },
    } as UseQueryResult<Transaction>);
    render(<TransactionsTable account={account} />);

    await screen.findByTestId('Table');
    const descriptionCol = TableMock.mock.calls[0][0].columns[1];

    expect(descriptionCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      descriptionCol.cell({
        row: {
          original: split,
        },
      }),
    );

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      queryKey: ['api', 'txs', 'tx_guid'],
    }));
    expect(container).toMatchSnapshot();
  });

  it('renders FromTo column as expected', async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({
      data: [
        {
          guid: 'account_guid_2',
          type: 'EXPENSE',
          path: 'Expenses:expense',
        },
        {
          guid: 'account_guid_3',
          type: 'INVESTMENT',
          path: 'account_guid_3.path',
        },
      ],
    } as UseQueryResult<Account[]>);
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: {
        guid: 'tx_guid',
        splits: [
          split,
          { accountId: 'account_guid_2' },
          { accountId: 'account_guid_3' },
        ],
      },
    } as UseQueryResult<Transaction>);
    render(<TransactionsTable account={account} />);

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

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      queryKey: ['api', 'txs', 'tx_guid'],
    }));
    expect(container).toMatchSnapshot();
  });

  it('renders Amount column as expected', async () => {
    render(<TransactionsTable account={account} />);

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
        account={account}
      />,
    );

    await screen.findByTestId('Table');
    const totalCol = TableMock.mock.calls[0][0].columns[4];

    expect(totalCol.cell).not.toBeUndefined();
    const { container } = render(
      // @ts-ignore
      totalCol.cell({
        row: {
          original: split,
        },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders Actions column as expected', async () => {
    const accounts = [
      { guid: 'account_guid_1' },
      { guid: 'account_guid_3' },
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({
      data: accounts,
    } as UseQueryResult<Account[]>);
    const tx = {
      guid: 'tx_guid',
      date: DateTime.fromISO('2023-01-01'),
      splits: [
        split,
        {
          accountId: 'account_guid_2',
          value: 100,
          quantity: 100,
        },
      ],
    };
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: tx,
    } as UseQueryResult<Transaction>);

    render(
      <TransactionsTable
        account={account}
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
        className: 'text-left text-cyan-700 hover:text-cyan-600',
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
          ...tx,
          date: '2023-01-01',
          splits: tx.splits.map(s => ({
            ...s,
            value: s.value,
            quantity: s.quantity,
            fk_account: accounts.find(a => a.guid === s.accountId),
          })),
        },
        onSave: expect.any(Function),
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        className: 'text-left text-cyan-700 hover:text-cyan-600',
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
          ...tx,
          date: '2023-01-01',
          splits: tx.splits.map(s => ({
            ...s,
            value: s.value,
            quantity: s.quantity,
            fk_account: accounts.find(a => a.guid === s.accountId),
          })),
        },
      },
      {},
    );

    const updateOnSave = (TransactionForm as jest.Mock).mock.calls[0][0].onSave;
    // @ts-ignore
    tx.queryClient = {
      invalidateQueries: jest.fn(),
    };
    updateOnSave();
    // Make sure we update the split related to the account we are displaying on update.
    // This is because sometimes the user may change the main split to be from
    // another account so we want to make sure the split disappears from the
    // transactions table and the total aggregations
    // @ts-ignore
    expect(tx.queryClient.invalidateQueries).toBeCalledWith({ queryKey: ['api', 'splits', 'account_guid_1'] });

    expect(container).toMatchSnapshot();
  });
});
