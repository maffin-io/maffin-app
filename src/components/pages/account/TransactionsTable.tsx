import React from 'react';
import { ColumnDef, CellContext, Row } from '@tanstack/react-table';
import classNames from 'classnames';
import Link from 'next/link';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { BiEdit, BiXCircle } from 'react-icons/bi';

import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import Table from '@/components/Table';
import Tooltip from '@/components/Tooltip';
import Money from '@/book/Money';
import {
  Account,
  Commodity,
  Split,
} from '@/book/entities';
import type { AccountsMap } from '@/types/book';

export type TransactionsTableProps = {
  splits: Split[],
  accounts: AccountsMap,
};

export default function TransactionsTable({
  splits,
  accounts,
}: TransactionsTableProps): JSX.Element {
  columns[2].cell = FromToAccountPartial(accounts);
  columns[3].cell = AmountPartial(accounts[splits[0]?.account.guid]);
  columns[4].cell = TotalPartial(accounts);

  return (
    <Table<Split>
      columns={columns}
      data={splits}
    />
  );
}

const columns: ColumnDef<Split>[] = [
  {
    header: 'Date',
    id: 'date',
    enableSorting: false,
    accessorFn: (row: Split) => row.transaction.date.toMillis(),
    cell: ({ row }) => (
      <Tooltip
        text={row.original.transaction.guid}
      >
        <span>
          {row.original.transaction.date.toISODate()}
        </span>
      </Tooltip>
    ),
  },
  {
    header: 'Description',
    enableSorting: false,
    accessorFn: (row: Split) => row.transaction.description,
  },
  {
    header: 'From/To',
    enableSorting: false,
  },
  {
    accessorKey: 'value',
    header: 'Amount',
    enableSorting: false,
  },
  {
    header: 'Total',
    enableSorting: false,
  },
  {
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => (
      <>
        <TransactionFormButton
          action="update"
          defaultValues={
            {
              ...row.original.transaction,
              date: row.original.transaction.date.toISODate() as string,
              fk_currency: row.original.transaction.currency as Commodity,
            }
          }
          className="link"
        >
          <BiEdit className="flex" />
        </TransactionFormButton>
        <TransactionFormButton
          action="delete"
          defaultValues={
            {
              ...row.original.transaction,
              date: row.original.transaction.date.toISODate() as string,
              fk_currency: row.original.transaction.currency as Commodity,
            }
          }
          className="link"
        >
          <BiXCircle className="flex" />
        </TransactionFormButton>
      </>
    ),
  },
];

function FromToAccountPartial(
  accounts: AccountsMap,
) {
  return function FromToAccount({ row }: CellContext<Split, unknown>): JSX.Element {
    const { splits } = row.original.transaction;
    const otherSplits = splits.filter(split => split.account.guid !== row.original.account.guid);

    return (
      <ul>
        { otherSplits.map(split => {
          const account = accounts[split.account.guid];

          return (
            <li key={split.guid}>
              <Link
                href={`/dashboard/accounts/${account.guid}`}
                className={classNames('badge hover:text-slate-300', {
                  'bg-green-500/20 text-green-300': account.type === 'INCOME',
                  'bg-red-500/20 text-red-300': account.type === 'EXPENSE',
                  'bg-cyan-500/20 text-cyan-300': ['ASSET', 'BANK'].includes(account.type),
                  'bg-orange-500/20 text-orange-300': account.type === 'LIABILITY',
                  'bg-violet-500/20 text-violet-300': ['STOCK', 'MUTUAL'].includes(account.type),
                })}
              >
                { account?.path }
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };
}

function AmountPartial(
  account?: Account,
) {
  return function Amount({ row }: CellContext<Split, unknown>): JSX.Element {
    let value = new Money(row.original.quantity, account?.commodity.mnemonic || '');

    if (account?.type === 'INCOME') {
      value = value.multiply(-1);
    }
    return (
      <span
        className={
          classNames({
            'text-green-300': value.toNumber() > 0,
            'text-red-300': value.toNumber() < 0,
          }, 'flex items-center')
        }
      >
        {value.toNumber() > 0 && <FaArrowUp className="text-xs mr-1" />}
        {value.toNumber() < 0 && <FaArrowDown className="text-xs mr-1" />}
        {value.format()}
      </span>
    );
  };
}

function TotalPartial(
  accounts: AccountsMap,
) {
  return function Total({ row, table }: CellContext<Split, unknown>): JSX.Element {
    const { rows } = table.getCoreRowModel();
    const currentRow = rows.findIndex(
      (otherRow: Row<Split>) => otherRow.original.guid === row.original.guid,
    );
    const nextRows = rows.slice(currentRow, rows.length + 1);
    const totalPreviousSplits = nextRows.reverse().reduce(
      (total: Money, otherRow: Row<Split>) => {
        const otherAccount = accounts[otherRow.original.account.guid];
        if (otherAccount.type === 'INCOME') {
          return total.add(
            new Money(-otherRow.original.quantity, otherAccount.commodity.mnemonic),
          );
        }
        return total.add(
          new Money(otherRow.original.quantity, otherAccount.commodity.mnemonic),
        );
      },
      new Money(0, accounts[row.original.account.guid].commodity.mnemonic),
    );

    return (
      <span>
        {totalPreviousSplits.format()}
      </span>
    );
  };
}
