import React from 'react';
import { DateTime } from 'luxon';
import type { ColumnDef } from '@tanstack/react-table';
import { BiEdit, BiXCircle } from 'react-icons/bi';

import { Tooltip } from '@/components/tooltips';
import FormButton from '@/components/buttons/FormButton';
import PriceForm from '@/components/forms/price/PriceForm';
import { Commodity, Price } from '@/book/entities';
import Table from '@/components/tables/Table';
import Money from '@/book/Money';

export type PricesTableProps = {
  prices: Price[],
};

export default function PricesTable({
  prices,
}: PricesTableProps): JSX.Element {
  return (
    <Table<Price>
      id="prices-table"
      columns={columns}
      data={prices}
      initialState={{
        pagination: {
          pageSize: 7,
        },
        sorting: [{
          id: 'date',
          desc: true,
        }],
      }}
      showPagination
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
          {row.original.date.toLocaleString(DateTime.DATE_SHORT)}
        </span>
        <Tooltip clickable id={row.original.guid} />
      </>
    ),
  },
  {
    header: 'Rate',
    enableSorting: false,
    accessorFn: (row: Price) => new Money(
      row.value,
      (row.fk_currency as Commodity).mnemonic,
    ).format(6, 6),
  },
  {
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      const price = row.original;
      const defaultValues = {
        ...price,
        date: price.date.toISODate() as string,
        fk_currency: price.fk_currency as Commodity,
        fk_commodity: price.fk_commodity as Commodity,
        value: price.value,
      };
      return (
        <>
          <FormButton
            id="edit-price"
            modalTitle="Edit price"
            buttonContent={<BiEdit className="flex" />}
            className="text-left text-cyan-700 hover:text-cyan-600"
          >
            <PriceForm
              action="update"
              defaultValues={defaultValues}
            />
          </FormButton>
          <FormButton
            id="delete-price"
            modalTitle="Confirm you want to remove this price"
            buttonContent={<BiXCircle className="flex" />}
            className="text-left text-cyan-700 hover:text-cyan-600"
          >
            <PriceForm
              action="delete"
              defaultValues={defaultValues}
            />
          </FormButton>
        </>
      );
    },
  },
];
