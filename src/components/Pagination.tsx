import React from 'react';
import { Table } from '@tanstack/react-table';

type PaginationProps<T> = {
  table: Table<T>,
};

export default function Pagination<T>({
  table,
}: PaginationProps<T>): JSX.Element {
  const { pagination } = table.getState();
  return (
    <div className="flex text-center text-sm items-center px-2 pb-1">
      <span className="mx-5">
        Page
        {' '}
        <strong>
          {table.getState().pagination.pageIndex + 1}
          {' '}
          of
          {' '}
          {table.getPageCount()}
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
          className="input w-1/4"
        />
      </span>

      <div className="ms-auto">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          className="bg-white dark:bg-dark-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.previousPage()}
          className="bg-white dark:bg-dark-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.nextPage()}
          className="bg-white dark:bg-dark-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        {' '}
        <button
          type="button"
          onClick={() => table.setPageIndex(table.getPageOptions().length - 1)}
          className="bg-white dark:bg-dark-700 rounded-full disabled:opacity-50 px-3 py-1"
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        {' '}
      </div>
    </div>
  );
}
