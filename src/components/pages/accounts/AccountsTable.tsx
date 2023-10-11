import React from 'react';
import { DateTime } from 'luxon';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { BiCircle, BiSolidRightArrow, BiSolidDownArrow } from 'react-icons/bi';
import classNames from 'classnames';
import { Tooltip } from 'react-tooltip';

import Money from '@/book/Money';
import Table from '@/components/Table';
import type { AccountsMap } from '@/types/book';
import { MonthlyTotals } from '@/lib/queries';
import { Account } from '@/book/entities';
import {
  isInvestment,
  isAsset,
  isLiability,
} from '@/book/helpers/accountType';
import * as API from '@/hooks/api';

export type AccountsTableProps = {
  selectedDate?: DateTime,
  isExpanded?: boolean,
};

type AccountsTableRow = {
  account: Account,
  total: Money,
  leaves: AccountsTableRow[],
};

export default function AccountsTable(
  {
    selectedDate = DateTime.now(),
    isExpanded = false,
  }: AccountsTableProps,
): JSX.Element {
  let { data: accounts } = API.useAccounts();
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();

  accounts = accounts || { root: { childrenIds: [] } };

  const tree = getTreeTotals(accounts.root, accounts, monthlyTotals || {}, selectedDate);

  return (
    <Table<AccountsTableRow>
      id="accounts-table"
      columns={columns}
      data={tree.leaves}
      initialSort={{ id: 'total', desc: true }}
      showHeader={false}
      showPagination={false}
      tdClassName="p-2"
      getSubRows={row => row.leaves}
      isExpanded={isExpanded}
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

  const accountTotal = Object.entries(monthlyTotals[current.guid] || {}).reduce(
    (total, [monthYear, amount]) => {
      if (DateTime.fromFormat(monthYear, 'MM/yyyy') <= selectedDate) {
        return total.add(amount);
      }
      return total;
    },
    new Money(0, current.commodity?.mnemonic || ''),
  );

  return {
    account: current,
    total: current.type === 'INCOME' || isLiability(current) ? accountTotal.multiply(-1) : accountTotal,
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
        {
          (
            row.original.account.placeholder
            && (
              <span
                data-tooltip-id={row.original.account.guid}
                className={classNames('badge cursor-default', {
                  success: row.original.account.type === 'INCOME',
                  danger: row.original.account.type === 'EXPENSE',
                  info: isAsset(row.original.account),
                  warning: isLiability(row.original.account),
                  'bg-violet-500/20 text-violet-300': isInvestment(row.original.account),
                })}
              >
                {row.original.account.name}
              </span>
            )
          ) || (
            <Link
              data-tooltip-id={row.original.account.guid}
              className={classNames('badge hover:text-slate-300', {
                success: row.original.account.type === 'INCOME',
                danger: row.original.account.type === 'EXPENSE',
                info: isAsset(row.original.account),
                warning: isLiability(row.original.account),
                'bg-violet-500/20 text-violet-300': isInvestment(row.original.account),
              })}
              href={`/dashboard/accounts/${row.original.account.guid}`}
            >
              {row.original.account.name}
            </Link>
          )
        }

        {
          row.original.account.description
          && (
            <Tooltip
              id={row.original.account.guid}
              className="bg-cyan-600 text-white rounded-lg p-2"
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
