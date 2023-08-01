import React from 'react';
import {
  ColumnDef,
  TableOptions,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  ColumnSort,
} from '@tanstack/react-table';
import classNames from 'classnames';
import { FaSortDown, FaSortUp } from 'react-icons/fa';

import Pagination from '@/components/Pagination';

export type TableProps<T extends object> = {
  columns: ColumnDef<T>[],
  data: T[],
  initialSort?: ColumnSort,
  pageSize?: number,
  showHeader?: boolean,
  showPagination?: boolean,
  tdClassName?: string,
  getSubRows?: (originalRow: T, index: number) => T[] | undefined,
};

export default function Table<T extends object = {}>(
  {
    columns,
    data,
    initialSort,
    pageSize = 10,
    showHeader = true,
    showPagination = true,
    tdClassName = 'px-6 py-4',
    getSubRows,
  }: TableProps<T>,
): JSX.Element {
  const tableConfig: TableOptions<T> = {
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableExpanding: true,
    getSubRows,
    initialState: {
      pagination: {
        pageSize,
      },
      sorting: (initialSort && [initialSort]) || undefined,
    },
  };

  if (showPagination) {
    tableConfig.getPaginationRowModel = getPaginationRowModel();
  }

  const table = useReactTable(tableConfig);

  return (
    <>
      <div className="relative overflow-hidden">
        <table className="w-full text-sm text-left">
          {
            showHeader
            && (
              <thead className="bg-gunmetal-700 text-slate-300">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-6 py-3"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {(
                            header.column.columnDef.header !== ''
                              && header.column.getCanSort()
                              && (
                                <div className="flex items-center cursor-pointer">
                                  <FaSortUp
                                    className={
                                      classNames(
                                        {
                                          'opacity-100': header.column.getIsSorted() === 'asc',
                                          'opacity-50': header.column.getIsSorted() !== 'asc',
                                        },
                                        'absolute',
                                      )
                                    }
                                  />
                                  <FaSortDown
                                    className={
                                      classNames(
                                        {
                                          'opacity-100': header.column.getIsSorted() === 'desc',
                                          'opacity-50': header.column.getIsSorted() !== 'desc',
                                        },
                                        'absolute',
                                      )
                                    }
                                  />
                                </div>
                              )
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            )
          }

          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-gunmetal-700">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={tdClassName}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {
        showPagination
        && <Pagination<T> table={table} />
      }
    </>
  );
}
