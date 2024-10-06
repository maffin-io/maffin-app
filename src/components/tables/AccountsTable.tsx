import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { BiCircle, BiSolidRightArrow, BiSolidDownArrow } from 'react-icons/bi';

import Money from '@/book/Money';
import { Tooltip } from '@/components/tooltips';
import Table from '@/components/tables/Table';
import { Account } from '@/book/entities';
import { useAccounts, useAccountsTotals } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';
import { accountColorCode } from '@/helpers/classNames';
import getAccountsTree from '@/lib/getAccountsTree';

export type AccountsTableProps = {
  guids: string[],
  isExpanded?: boolean,
};

export default function AccountsTable(
  {
    guids,
    isExpanded = false,
  }: AccountsTableProps,
): JSX.Element {
  const { data } = useAccounts();
  const { data: accountsTotal } = useAccountsTotals();

  const accounts = mapAccounts(data);
  const trees: AccountsTableRow[] = [];
  guids.forEach(guid => {
    if (accounts[guid] && !accounts[guid].hidden) {
      trees.push(getAccountsTree(
        accounts[guid],
        accounts,
        accountsTotal || {},
      ));
    }
  });

  return (
    <Table<AccountsTableRow>
      id={`${guids.join('-')}-table`}
      columns={columns}
      data={trees}
      initialState={{
        sorting: [{ id: 'total', desc: true }],
      }}
      showHeader={false}
      tdClassName="p-2"
      getSubRows={row => row.leaves}
      isExpanded={isExpanded}
    />
  );
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
                ? <BiSolidDownArrow className="mr-1 text-xs opacity-50" />
                : <BiSolidRightArrow className="mr-1 text-xs opacity-50" />
            )}
          </button>
        ) : (
          <span>
            <BiCircle className="mr-1 text-xs opacity-50" />
          </span>
        )}
        <Link
          data-tooltip-id={row.original.account.guid}
          className={accountColorCode(row.original.account, 'badge hover:text-white')}
          href={`/dashboard/accounts/${row.original.account.guid}`}
        >
          {row.original.account.name}
        </Link>

        {
          row.original.account.description
          && (
            <Tooltip
              place="bottom"
              className="max-w-[80%]"
              id={row.original.account.guid}
            >
              {row.original.account.description}
            </Tooltip>
          )
        }
      </div>
    ),
  },
  {
    accessorFn: (row: AccountsTableRow) => row.total.toNumber(),
    id: 'total',
    header: '',
    cell: ({ row }) => (
      <span>
        {row.original.total.format()}
      </span>
    ),
  },
];

type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};
