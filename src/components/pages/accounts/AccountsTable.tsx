import React from 'react';
import { DateTime } from 'luxon';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { BiCircle, BiSolidRightArrow, BiSolidDownArrow } from 'react-icons/bi';
import classNames from 'classnames';

import Money from '@/book/Money';
import Table from '@/components/Table';
import type { AccountsMap } from '@/types/book';
import { MonthlyTotals } from '@/lib/queries';
import { Account } from '@/book/entities';

export type AccountsTableProps = {
  selectedDate?: DateTime,
  accounts: AccountsMap,
  monthlyTotals: MonthlyTotals,
};

type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};

export default function AccountsTable(
  {
    selectedDate = DateTime.now(),
    accounts,
    monthlyTotals,
  }: AccountsTableProps,
): JSX.Element {
  return (
    <Table<AccountsTableRow>
      columns={columns}
      data={getTreeTotals(accounts.root, accounts, monthlyTotals, selectedDate).leaves}
      initialSort={{ id: 'total', desc: true }}
      showHeader={false}
      showPagination={false}
      tdClassName="p-2"
      getSubRows={row => row.leaves}
    />
  );
}

function getTreeTotals(
  current: Account,
  accounts: AccountsMap,
  monthlyTotals: MonthlyTotals,
  selectedDate: DateTime,
): AccountsTableRow {
  const leaves = current.childrenIds.map(
    childId => getTreeTotals(accounts[childId], accounts, monthlyTotals, selectedDate),
  );

  return {
    account: current,
    total: Object.entries(monthlyTotals[current.guid] || {}).reduce(
      (total, [monthYear, amount]) => {
        if (DateTime.fromFormat(monthYear, 'MM/yyyy') <= selectedDate) {
          return total.add(amount);
        }
        return total;
      },
      new Money(0, current.commodity?.mnemonic || ''),
    ),
    leaves,
  };
}

const columns: ColumnDef<AccountsTableRow>[] = [
  {
    accessorKey: 'name',
    id: 'name',
    enableSorting: false,
    header: '',
    cell: ({ row }) => (
      <div
        className={`flex pl-${row.depth * 4}`}
      >
        {row.getCanExpand() ? (
          <button
            type="button"
            onClick={() => row.toggleExpanded()}
          >
            {(
              row.getIsExpanded()
                ? <BiSolidDownArrow className="mr-1 text-xs opacity-20" />
                : <BiSolidRightArrow className="mr-1 text-xs opacity-20" />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="cursor-default"
          >
            <BiCircle className="mr-1 text-xs opacity-20" />
          </button>
        )}
        <Link
          className={classNames('badge hover:text-slate-300', {
            'bg-green-500/20 text-green-300': row.original.account.type === 'INCOME',
            'bg-red-500/20 text-red-300': row.original.account.type === 'EXPENSE',
            'bg-cyan-500/20 text-cyan-300': ['ASSET', 'BANK'].includes(row.original.account.type),
            'bg-orange-500/20 text-orange-300': row.original.account.type === 'LIABILITY',
            'bg-violet-500/20 text-violet-300': ['STOCK', 'MUTUAL'].includes(row.original.account.type),
          })}
          href={`/dashboard/accounts/${row.original.account.guid}`}
        >
          {row.original.account.name}
        </Link>
      </div>
    ),
  },
  {
    accessorFn: (row: AccountsTableRow) => Math.abs(row.total.toNumber()),
    id: 'total',
    header: '',
    cell: ({ row }) => (
      <span>
        {row.original.total.format()}
      </span>
    ),
  },
];
