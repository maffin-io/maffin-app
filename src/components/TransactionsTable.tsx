import React from 'react';
import { ColumnDef, CellContext, Row } from '@tanstack/react-table';
import classNames from 'classnames';
import Link from 'next/link';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

import Table from '@/components/Table';
import Tooltip from '@/components/Tooltip';
import useDataSource from '@/hooks/useDataSource';
import Money from '@/book/Money';
import {
  Account,
  Split,
} from '@/book/entities';

export type TransactionsTableProps = {
  accountId: string,
  accounts: Account[],
};

export default function TransactionsTable({
  accountId,
  accounts,
}: TransactionsTableProps): JSX.Element {
  const [datasource] = useDataSource();
  const [splits, setSplits] = React.useState<Split[]>([]);

  React.useEffect(() => {
    async function load() {
      const newSplits = await Split.find({
        where: {
          fk_account: {
            guid: accountId,
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
            date: 'ASC',
          },
        },
      });
      setSplits(newSplits);
    }

    if (datasource && accountId) {
      load();
    }
  }, [datasource, accountId]);

  if (!accountId) {
    return (
      <span>Select an account to see transactions</span>
    );
  }

  columns[2].cell = FromToAccountPartial(accounts);

  return (
    <Table<Split>
      columns={columns}
      data={splits}
      initialSort={{ id: 'date', desc: true }}
    />
  );
}

const columns: ColumnDef<Split>[] = [
  {
    header: 'Date',
    id: 'date',
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
    cell: ({ row }) => {
      let value = new Money(row.original.quantity, row.original.account.commodity.mnemonic);

      if (row.original.account.type === 'INCOME') {
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
    },
  },
  {
    header: 'Total',
    enableSorting: false,
    cell: ({ row, table }) => {
      const { rows } = table.getCoreRowModel();
      const currentRow = rows.findIndex(
        (otherRow: Row<Split>) => otherRow.original.guid === row.original.guid,
      );
      const previousRows = rows.slice(0, currentRow + 1);
      const totalPreviousSplits = previousRows.reduce(
        (total: Money, otherRow: Row<Split>) => {
          if (otherRow.original.account.type === 'INCOME') {
            return total.add(
              new Money(-otherRow.original.quantity, otherRow.original.account.commodity.mnemonic),
            );
          }
          return total.add(
            new Money(otherRow.original.quantity, otherRow.original.account.commodity.mnemonic),
          );
        },
        new Money(0, row.original.account.commodity.mnemonic),
      );

      return (
        <span>
          {totalPreviousSplits.format()}
        </span>
      );
    },
  },
];

function FromToAccountPartial(
  accounts: Account[],
) {
  return function FromToAccount({ row }: CellContext<Split, unknown>): JSX.Element {
    const { splits } = row.original.transaction;
    const otherSplits = splits.filter(split => split.account.guid !== row.original.account.guid);

    return (
      <ul>
        { otherSplits.map(split => {
          const account = accounts.find(a => a.guid === split.account.guid);

          return (
            <li key={split.guid}>
              <Link
                href={`/dashboard/accounts/${split.account.guid}`}
                className={classNames('badge', {
                  'bg-green-500/20 text-green-300': split.account.type === 'INCOME',
                  'bg-red-500/20 text-red-300': split.account.type === 'EXPENSE',
                  'bg-cyan-500/20 text-cyan-300': ['ASSET', 'BANK'].includes(split.account.type),
                  'bg-orange-500/20 text-orange-300': split.account.type === 'LIABILITY',
                  'bg-violet-500/20 text-violet-300': ['STOCK', 'MUTUAL'].includes(split.account.type),
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
