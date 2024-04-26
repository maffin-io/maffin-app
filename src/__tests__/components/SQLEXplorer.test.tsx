import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { EntityMetadata } from 'typeorm';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

import SQLExplorer from '@/components/SQLExplorer';
import Table from '@/components/tables/Table';
import * as dataSourceHooks from '@/hooks/useDataSource';
import type { DataSourceContextType } from '@/hooks';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/components/tables/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('SQLExplorer', () => {
  let metadatas: EntityMetadata[];

  beforeEach(() => {
    metadatas = [
      {
        givenTableName: 'table1',
        columns: [
          {
            databaseName: 'column1',
            type: 'varchar',
            isSelect: true,
          },
        ],
      } as EntityMetadata,
      {
        givenTableName: 'table2',
        columns: [
          {
            databaseName: 'column2',
            type: 'varchar',
            isSelect: true,
          },
        ],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadatas,
      },
    } as DataSourceContextType);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading when no datasource', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: null,
    } as DataSourceContextType);

    render(<SQLExplorer />);
    await screen.findByTestId('Loading');
  });

  it('renders all metadata', () => {
    const { container } = render(<SQLExplorer />);
    expect(container).toMatchSnapshot();
    expect(Table as jest.Mock).nthCalledWith(
      1,
      {
        id: 'sql-table-table1',
        showHeader: false,
        columns: [
          {
            accessorKey: 'databaseName',
          },
          {
            accessorFn: expect.any(Function),
            id: 'type',
          },
        ],
        data: metadatas[0].columns,
      },
      {},
    );
    expect(Table as jest.Mock).nthCalledWith(
      2,
      {
        id: 'sql-table-table2',
        showHeader: false,
        columns: [
          {
            accessorKey: 'databaseName',
          },
          {
            accessorFn: expect.any(Function),
            id: 'type',
          },
        ],
        data: metadatas[1].columns,
      },
      {},
    );
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getAllByTestId('Table')[0].parentElement).toHaveClass('hidden');
  });

  it('filters non select columns', () => {
    const metadata = [
      {
        givenTableName: 'table1',
        columns: [
          {
            databaseName: 'column1',
            type: 'varchar',
            isSelect: true,
          },
          {
            databaseName: 'column2',
            type: 'varchar',
            isSelect: false,
          },
        ],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadata,
      },
    } as DataSourceContextType);

    render(<SQLExplorer />);

    expect(Table as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        data: [metadata[0].columns[0]],
      }),
      {},
    );
  });

  it('picks type', () => {
    const metadata = [
      {
        givenTableName: 'table1',
        columns: [] as ColumnMetadata[],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadata,
      },
    } as DataSourceContextType);

    render(<SQLExplorer />);

    const { accessorFn } = (Table as jest.Mock).mock.calls[0][0].columns[1];
    expect(accessorFn({ type: 'name' })).toEqual('name');
  });

  it('picks type with length', () => {
    const metadata = [
      {
        givenTableName: 'table1',
        columns: [] as ColumnMetadata[],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadata,
      },
    } as DataSourceContextType);

    render(<SQLExplorer />);

    const { accessorFn } = (Table as jest.Mock).mock.calls[0][0].columns[1];
    expect(accessorFn({ type: 'name', length: '10' })).toEqual('name(10)');
  });

  it('picks type name', () => {
    const metadata = [
      {
        givenTableName: 'table1',
        columns: [] as ColumnMetadata[],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadata,
      },
    } as DataSourceContextType);

    render(<SQLExplorer />);

    const { accessorFn } = (Table as jest.Mock).mock.calls[0][0].columns[1];
    expect(accessorFn({ type: { name: 'name' } })).toEqual('name');
  });

  it('displays table on click', async () => {
    const metadata = [
      {
        givenTableName: 'table1',
        columns: [] as ColumnMetadata[],
      } as EntityMetadata,
    ];
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        entityMetadatas: metadata,
      },
    } as DataSourceContextType);

    render(<SQLExplorer />);

    const title = screen.getByText('table1');
    await userEvent.click(title);

    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByTestId('Table').parentElement).toHaveClass('visible');
  });
});
