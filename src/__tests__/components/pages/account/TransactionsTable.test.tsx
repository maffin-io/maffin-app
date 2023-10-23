import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import type { LinkProps } from 'next/link';
import { BiEdit, BiXCircle } from 'react-icons/bi';
import type { SWRResponse } from 'swr';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import Table from '@/components/Table';
import { TransactionsTable } from '@/components/pages/account';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
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

jest.mock('@/components/buttons/TransactionFormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="TransactionFormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TransactionsTable', () => {
  let eur: Commodity;
  let accounts: AccountsMap;
  let splits1: Split[];

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

    splits1 = [
      {
        guid: 'split_guid_1',
        action: '',
        value: -100,
        quantity: -100,
        transaction: {
          guid: 'tx_guid',
          description: 'random expense',
          date: DateTime.fromISO('2023-01-01'),
          splits: [
            {
              guid: 'splits_guid_1',
              action: '',
              account: {
                // splits here are not ordered consistently
                guid: 'account_guid_1',
                childrenIds: [] as string[],
              } as Account,
            } as Split,
            {
              guid: 'splits_guid_2',
              action: '',
              account: {
                guid: 'account_guid_2',
                childrenIds: [] as string[],
              } as Account,
            } as Split,
          ],
        } as Transaction,
        account: {
          guid: 'account_guid_1',
          childrenIds: [] as string[],
        } as Account,
      } as Split,
    ];

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: accounts } as SWRResponse);
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: splits1 } as SWRResponse);
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
      data: splits1,
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
          original: splits1[0],
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
          original: splits1[0],
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
          original: splits1[0],
        },
      }),
    );

    expect(container).toMatchSnapshot();

    ({ container } = render(
      // @ts-ignore
      amountCol.cell({
        row: {
          original: splits1[0],
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
          original: splits1[0],
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
          ...splits1[0].transaction,
          date: '2023-01-01',
          fk_currency: undefined,
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
          ...splits1[0].transaction,
          date: '2023-01-01',
          fk_currency: undefined,
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
