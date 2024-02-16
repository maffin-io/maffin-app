import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from 'react-tooltip';
import { BiEdit, BiXCircle } from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import PriceForm from '@/components/forms/price/PriceForm';
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
      initialState={{
        pagination: {
          pageSize: 7,
        },
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
            className="link"
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
            className="link"
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
