import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DateTime } from 'luxon';
import Link from 'next/link';

import {
  Account,
  Book,
} from '@/book/entities';
import Money from '@/book/Money';
import { PriceDB } from '@/book/prices';
import type { PriceDBMap } from '@/book/prices';
import Table from '@/components/Table';
import useDataSource from '@/hooks/useDataSource';

export type Record = {
  guid: string,
  name: string,
  type: string,
  total: Money,
  subRows: Record[],
};

export default function AccountsTable(): JSX.Element {
  const [dataSource] = useDataSource();
  const [isLoading, setIsLoading] = React.useState(true);
  const [accountsRows, setAccountsRows] = React.useState<Record[]>([]);

  React.useEffect(() => {
    async function load() {
      if (dataSource) {
        let start;
        let end;
        const books = await Book.find();
        const rootAccount = books[0].root;

        start = performance.now();
        const [rootTree, todayQuotes] = await Promise.all([
          dataSource.manager.getTreeRepository(Account).findDescendantsTree(
            rootAccount,
            {
              relations: ['fk_commodity', 'splits', 'splits.fk_transaction'],
            },
          ),
          PriceDB.getTodayQuotes(),
        ]);
        end = performance.now();
        console.log(`tree render time + today quotes: ${end - start}ms`);

        start = performance.now();
        const rootRecord = buildNestedRows(rootTree, todayQuotes);
        end = performance.now();
        setAccountsRows(rootRecord.subRows);
        setIsLoading(false);
      }
    }

    load();
  }, [dataSource]);

  if (isLoading) {
    return (
      <span>
        Loading...
      </span>
    );
  }

  if (!accountsRows.length) {
    return (
      <span>
        Add accounts to start seeing some data!
      </span>
    );
  }

  return (
    <Table<Record>
      columns={columns}
      data={accountsRows}
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
function buildNestedRows(current: Account, todayQuotes: PriceDBMap): Record {
  const { children } = current;
  let { total } = current;
  let subRows: Record[] = [];

  if (current.type === 'ROOT') {
    subRows = children.map(child => {
      const childRecord = buildNestedRows(child, todayQuotes);
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

    subRows = children.map(child => {
      const childRecord = buildNestedRows(child, todayQuotes);
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
