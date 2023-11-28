import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from 'react-tooltip';

import Table from '@/components/Table';
import { Commodity, Price } from '@/book/entities';
import Money from '@/book/Money';

export type PricesTableProps = {
  prices: Price[],
};

export default function TransactionsTable({
  prices,
}: PricesTableProps): JSX.Element {
  return (
    <Table<Price>
      id="prices-table"
      columns={columns}
      data={prices}
      initialSort={{ id: 'date', desc: true }}
      pageSize={7}
    />
  );
}

const columns: ColumnDef<Price>[] = [
  {
    header: 'Date',
    id: 'date',
    accessorFn: (price: Price) => price.date.toMillis(),
    cell: ({ row }) => (
      <>
        <span
          data-tooltip-id={row.original.guid}
          data-tooltip-content={row.original.guid}
        >
          {row.original.date.toISODate()}
        </span>
        <Tooltip clickable className="tooltip" id={row.original.guid} />
      </>
    ),
  },
  {
    header: 'Rate',
    enableSorting: false,
    accessorFn: (row: Price) => new Money(
      row.value,
      (row.fk_currency as Commodity).mnemonic,
    ).format(),
  },
];
