import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { BiCircle, BiSolidRightArrow, BiSolidDownArrow } from 'react-icons/bi';
import classNames from 'classnames';

import Table from '@/components/Table';
import type { AccountsTree } from '@/types/accounts';

export type AccountsTableProps = {
  tree: AccountsTree,
};

export default function AccountsTable(
  {
    tree,
  }: AccountsTableProps,
): JSX.Element {
  return (
    <Table<AccountsTree>
      columns={columns}
      data={tree.children}
      initialSort={{ id: 'total', desc: true }}
      showHeader={false}
      showPagination={false}
      tdClassName="p-2"
      getSubRows={row => row.children}
    />
  );
}

const columns: ColumnDef<AccountsTree>[] = [
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
    accessorFn: (row: AccountsTree) => row.total.toNumber(),
    id: 'total',
    header: '',
    cell: ({ row }) => (
      <span>
        {row.original.total.format()}
      </span>
    ),
  },
];
