import React from 'react';
import { Table } from '@tanstack/react-table';

type PaginationProps = {
  table: Table<any>,
};

export default function Pagination({ table }: PaginationProps): JSX.Element {
  const { pagination } = table.getState();
  return (
    <div className="flex text-center text-sm items-center px-2 pb-1">
      <label className="mr-1">Display:</label>
      <select
        value={pagination.pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
        }}
      >
        {sizePerPageList.map((pageSize, index) => (
          <option key={index} value={pageSize.value}>
            {pageSize.text}
          </option>
        ))}
      </select>

      <span className="mx-5">
        Page
        {' '}
        <strong>
          {pagination.pageIndex + 1}
          {' '}
          of
          {' '}
          {table.getPageOptions().length}
        </strong>
        {' '}
      </span>

      <span className="flex justify-start items-center">
        <label className="mr-1">Go to page:</label>
        <input
          type="number"
          defaultValue={pagination.pageIndex + 1}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
          className="w-1/4"
        />
      </span>

      <div className="ms-auto">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          className="bg-gunmetal-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.previousPage()}
          className="bg-gunmetal-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.nextPage()}
          className="bg-gunmetal-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.setPageIndex(table.getPageOptions().length - 1)}
          className="bg-gunmetal-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        {' '}
      </div>
    </div>
  );
}

const sizePerPageList = [
  {
    text: '5',
    value: 5,
  },
  {
    text: '10',
    value: 10,
  },
  {
    text: '50',
    value: 50,
  },
];
