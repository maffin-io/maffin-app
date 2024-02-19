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
import {
  isLiability,
} from '@/book/helpers/accountType';
import { useAccounts, useAccountsTotal } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';
import { accountColorCode } from '@/helpers/classNames';

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
  const { data: accountsTotal } = useAccountsTotal(selectedDate);

  const accounts = mapAccounts(data);
  const assetsTree = getTreeTotals(
    accounts.type_asset,
    accounts,
    accountsTotal || {},
    selectedDate,
  );

  const liabilitiesTree = getTreeTotals(
    accounts.type_liability,
    accounts,
    accountsTotal || {},
    selectedDate,
  );

  const incomeTree = getTreeTotals(
    accounts.type_income,
    accounts,
    accountsTotal || {},
    selectedDate,
  );

  const expensesTree = getTreeTotals(
    accounts.type_expense,
    accounts,
    accountsTotal || {},
    selectedDate,
  );

  return (
    <div className="divide-y divide-slate-400/25">
      <div className="pb-2">
        <Table<AccountsTableRow>
          id="al-table"
          columns={columns}
          data={[assetsTree, liabilitiesTree]}
          initialState={{
            sorting: [{ id: 'total', desc: true }],
          }}
          showHeader={false}
          tdClassName="p-2"
          getSubRows={row => row.leaves}
          isExpanded={isExpanded}
        />
      </div>

      <div className="pt-2">
        <Table<AccountsTableRow>
          id="ie-table"
          columns={columns}
          data={[incomeTree, expensesTree]}
          initialState={{
            sorting: [{ id: 'total', desc: true }],
          }}
          showHeader={false}
          tdClassName="p-2"
          getSubRows={row => row.leaves}
          isExpanded={isExpanded}
        />
      </div>
    </div>
  );
}

function getTreeTotals(
  current: Account,
  accounts: AccountsMap,
  accountsTotal: { [guid: string]: Money },
  selectedDate: DateTime,
): AccountsTableRow {
  const leaves: AccountsTableRow[] = [];
  current.childrenIds.forEach(childId => {
    const childAccount = accounts[childId];
    if (!childAccount.hidden && childAccount.parentId === current.guid) {
      leaves.push(getTreeTotals(childAccount, accounts, accountsTotal, selectedDate));
    }
  });

  const accountTotal = accountsTotal[current.guid] || new Money(0, current.commodity?.mnemonic || '');

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
                className={accountColorCode(row.original.account, 'badge cursor-default')}
              >
                {row.original.account.name}
              </span>
            )
          ) || (
            <Link
              data-tooltip-id={row.original.account.guid}
              className={accountColorCode(row.original.account, 'badge hover:text-slate-300')}
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
