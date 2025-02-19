import React from 'react';
import {
  ColumnDef,
  TableOptions,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  ExpandedState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import classNames from 'classnames';
import { FaSortDown, FaSortUp } from 'react-icons/fa';

import Pagination from '@/components/Pagination';

export type TableProps<T extends object> = {
  id: string,
  columns: ColumnDef<T>[],
  data: T[],
  showHeader?: boolean,
  showPagination?: boolean,
  tdClassName?: string,
  isExpanded?: boolean,
} & Partial<TableOptions<T>>;

export default function Table<T extends object = {}>(
  {
    id,
    showHeader = true,
    showPagination = false,
    tdClassName = 'px-6 py-4',
    isExpanded = false,
    ...props
  }: TableProps<T>,
): React.JSX.Element {
  const tableConfig: TableOptions<T> = {
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableExpanding: true,
    initialState: {
      ...props.initialState,
      expanded: isExpanded as ExpandedState,
    },
    ...props,
  };

  if (showPagination && !props.manualPagination) {
    tableConfig.getPaginationRowModel = getPaginationRowModel();
  }

  const table = useReactTable(tableConfig);

  return (
    <>
      <div className="relative overflow-x-scroll rounded-md">
        <table id={id} className="w-full text-sm text-center md:text-left">
          {
            showHeader
            && (
              <thead className="bg-background-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-6 py-3"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex justify-center md:justify-start">
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
              <tr key={row.id} className="border-b border-background-700">
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
