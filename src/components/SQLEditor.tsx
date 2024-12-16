'use client';

import React from 'react';
import { BiPlay } from 'react-icons/bi';
import { BaseEntity } from 'typeorm';
import type { ColumnDef } from '@tanstack/react-table';

import { useDataSource } from '@/hooks';
import Table from '@/components/tables/Table';

export default function SQLEditor(): React.JSX.Element {
  const { datasource } = useDataSource();
  const [rows, setRows] = React.useState<BaseEntity[]>([]);
  const [error, setError] = React.useState<Error | null>();
  const [query, setQuery] = React.useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [columns, setColumns] = React.useState<ColumnDef<any>[]>([]);

  return (
    <>
      <div className="card">
        <textarea
          id="sql-editor"
          className="rounded-md p-2 w-full"
          name="SQL"
          rows={10}
          onChange={e => setQuery(e.target.value)}
        />
        <p className="my-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                const r = await datasource?.query(query);
                setRows(r);
                setColumns(Object.keys(r[0]).map(k => ({
                  header: k,
                  accessorKey: k,
                })));
                setError(null);
              } catch (e) {
                setRows([]);
                setError(e as Error);
              }
            }}
          >
            <BiPlay className="mr-1" />
            Run
          </button>
        </p>
      </div>
      {
        error
          ? (
            <p className="invalid-feedback">{error.message}</p>
          )
          : (
            <div className="card overflow-x-auto !bg-inherit">
              <Table
                id="sql-table"
                columns={columns}
                data={rows}
                showPagination
              />
            </div>
          )
        }
    </>
  );
}
