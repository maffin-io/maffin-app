import React from 'react';
import { DateTime } from 'luxon';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { BiCircle, BiSolidRightArrow, BiSolidDownArrow } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';

import Money from '@/book/Money';
import Table from '@/components/Table';
import type { AccountsMap } from '@/types/book';
import { Account } from '@/book/entities';
import { useAccounts, useAccountsTotals } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';
import { accountColorCode } from '@/helpers/classNames';

export type AccountsTableProps = {
  guids: string[],
  selectedDate?: DateTime,
  isExpanded?: boolean,
};

export default function AccountsTable(
  {
    guids,
    selectedDate = DateTime.now(),
    isExpanded = false,
  }: AccountsTableProps,
): JSX.Element {
  const { data } = useAccounts();
  const { data: accountsTotal } = useAccountsTotals(selectedDate);

  const accounts = mapAccounts(data);
  const trees: AccountsTableRow[] = [];
  guids.forEach(guid => {
    if (accounts[guid] && !accounts[guid].hidden) {
      trees.push(getTree(
        accounts[guid],
        accounts,
        accountsTotal || {},
        selectedDate,
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

function getTree(
  current: Account,
  accounts: AccountsMap,
  accountsTotal: { [guid: string]: Money },
  selectedDate: DateTime,
): AccountsTableRow {
  const leaves: AccountsTableRow[] = [];
  current.childrenIds.forEach(childId => {
    const childAccount = accounts[childId];
    if (!childAccount.hidden && childAccount.parentId === current.guid) {
      leaves.push(getTree(childAccount, accounts, accountsTotal, selectedDate));
    }
  });

  const accountTotal = accountsTotal[current.guid] || new Money(0, current.commodity?.mnemonic || '');

  return {
    account: current,
    total: accountTotal,
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
                ? <BiSolidDownArrow className="mr-1 text-xs opacity-50" />
                : <BiSolidRightArrow className="mr-1 text-xs opacity-50" />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="cursor-default"
          >
            <BiCircle className="mr-1 text-xs opacity-50" />
          </button>
        )}
        <Link
          data-tooltip-id={row.original.account.guid}
          className={accountColorCode(row.original.account, 'badge hover:text-slate-300')}
          href={`/dashboard/accounts/${row.original.account.guid}`}
        >
          {row.original.account.name}
        </Link>

        {
          row.original.account.description
          && (
            <Tooltip
              id={row.original.account.guid}
              className="tooltip"
              disableStyleInjection
            >
              {row.original.account.description}
            </Tooltip>
          )
        }
      </div>
    ),
  },
  {
    accessorFn: (row: AccountsTableRow) => row.total.abs().toNumber(),
    id: 'total',
    header: '',
    cell: ({ row }) => (
      <span>
        {row.original.total.abs().format()}
      </span>
    ),
  },
];

type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};
