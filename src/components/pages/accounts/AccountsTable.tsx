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
import { useAccountsTotals, useAccounts } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';

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
  const { data } = useAccounts();
  const { data: monthlyTotals } = useAccountsTotals();

  const accounts = mapAccounts(data);
  const tree = getTreeTotals(accounts.type_root, accounts, monthlyTotals || {}, selectedDate);

  return (
    <Table<AccountsTableRow>
      id="accounts-table"
      columns={columns}
      data={tree.leaves}
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

function getTreeTotals(
  current: Account,
  accounts: AccountsMap,
  monthlyTotals: MonthlyTotals,
  selectedDate: DateTime,
): AccountsTableRow {
  const leaves: AccountsTableRow[] = [];
  current.childrenIds.forEach(childId => {
    const childAccount = accounts[childId];
    if (!childAccount.hidden && childAccount.parentId === current.guid) {
      leaves.push(getTreeTotals(childAccount, accounts, monthlyTotals, selectedDate));
    }
  });

  let accountTotal = (monthlyTotals[current.guid] || {})[selectedDate.toFormat('MM/yyyy')]
    || new Money(0, current.commodity?.mnemonic || '');
  if (!isAsset(current) && !isLiability(current)) {
    accountTotal = Object.entries(monthlyTotals[current.guid] || {}).reduce(
      (total, [monthYear, amount]) => {
        if (DateTime.fromFormat(monthYear, 'MM/yyyy') <= selectedDate) {
          return total.add(amount);
        }
        return total;
      },
      new Money(0, current.commodity?.mnemonic || ''),
    );
  }

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
                  misc: isInvestment(row.original.account),
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
                misc: isInvestment(row.original.account),
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
