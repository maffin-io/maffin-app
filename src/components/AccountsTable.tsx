import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DateTime } from 'luxon';
import Link from 'next/link';

import { Account } from '@/book/entities';
import Money from '@/book/Money';
import type { PriceDBMap } from '@/book/prices';
import Table from '@/components/Table';

export type Record = {
  guid: string,
  name: string,
  type: string,
  total: Money,
  subRows: Record[],
};

export type AccountsTableProps = {
  accounts: Account[],
  todayPrices: PriceDBMap,
};

export default function AccountsTable(
  {
    accounts,
    todayPrices,
  }: AccountsTableProps,
): JSX.Element {
  let rows: Record[] = [];

  const root = accounts.find(a => a.type === 'ROOT');
  if (root && !todayPrices.isEmpty) {
    rows = buildNestedRows(root, accounts, todayPrices).subRows;
  }

  return (
    <Table<Record>
      columns={columns}
      data={rows}
      initialSort={{ id: 'total', desc: true }}
      showHeader={false}
      showPagination={false}
    />
  );
}

const columns: ColumnDef<Record>[] = [
  {
    accessorKey: 'name',
    id: 'name',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/dashboard/accounts/${row.original.guid}`}>
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorFn: (row: Record) => row.total.toNumber(),
    id: 'total',
    header: '',
    cell: ({ row }) => (
      <span>
        {row.original.total.format()}
      </span>
    ),
  },
];

/**
 * This function recursively goes through all the accounts so it can build the tree
 * of accounts containing total and subrows so they can be rendered in react table.
 *
 * Note that it interacts with PriceDB so prices can be aggregated to the parent's
 * total in order to display total amounts of assets, income, etc.
 */
function buildNestedRows(
  current: Account,
  accounts: Account[],
  todayQuotes: PriceDBMap,
): Record {
  const { childrenIds } = current;
  let { total } = current;
  let subRows: Record[] = [];

  if (current.type === 'ROOT') {
    subRows = childrenIds.map(childId => {
      const child = accounts.find(a => a.guid === childId) as Account;
      const childRecord = buildNestedRows(child, accounts, todayQuotes);
      return childRecord;
    });
  } else {
    const commodity = current.commodity.mnemonic;
    if (['STOCK', 'MUTUAL'].includes(current.type)) {
      const price = todayQuotes.getStockPrice(
        current.commodity.mnemonic,
        DateTime.now(),
      );
      total = total.convert(price.currency.mnemonic, price.value);
    }
    subRows = childrenIds.map(childId => {
      const child = accounts.find(a => a.guid === childId) as Account;
      const childRecord = buildNestedRows(child, accounts, todayQuotes);
      let childTotal = childRecord.total;
      if (childTotal.currency !== commodity) {
        const price = todayQuotes.getPrice(
          childTotal.currency,
          commodity,
          DateTime.now(),
        );
        childTotal = childTotal.convert(commodity, price.value);
      }
      total = total.add(childTotal);
      return childRecord;
    });
  }

  return {
    guid: current.guid,
    name: current.name,
    type: current.type,
    total,
    subRows,
  };
}
