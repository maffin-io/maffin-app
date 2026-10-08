import React from 'react';
import type { DataSource } from 'typeorm';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import SQLEditor from '@/components/SQLEditor';
import * as dataSourceHooks from '@/hooks/useDataSource';
import Table from '@/components/tables/Table';
import type { DataSourceContextType } from '@/hooks';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/components/tables/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));

describe('SQLEditor', () => {
  beforeEach(() => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        query: jest.fn() as Function,
      },
    } as DataSourceContextType);
  });

  it('renders as expected', () => {
    const { container } = render(<SQLEditor />);

    expect(container).toMatchSnapshot();
    expect(Table).toBeCalledWith(
      {
        columns: [],
        data: [],
        id: 'sql-table',
        showPagination: true,
      },
      undefined,
    );
  });

  it('shows query results', async () => {
    const mockQuery = jest.fn().mockResolvedValue([
      {
        name: 'name',
        type: 'type',
      },
    ]);
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        query: mockQuery as DataSource['query'],
      } as DataSource,
    } as DataSourceContextType);

    render(<SQLEditor />);

    const queryText = screen.getByRole('textbox');
    await userEvent.type(queryText, 'SELECT * from accounts');

    const runButton = screen.getByText('Run');
    await userEvent.click(runButton);

    expect(mockQuery).toBeCalledWith('SELECT * from accounts');
    expect(Table).toBeCalledWith(
      expect.objectContaining({
        columns: [
          {
            header: 'name',
            accessorKey: 'name',
          },
          {
            header: 'type',
            accessorKey: 'type',
          },
        ],
        data: [
          {
            name: 'name',
            type: 'type',
          },
        ],
      }),
      undefined,
    );
  });

  it('shows query error', async () => {
    const mockQuery = jest.fn().mockImplementation(() => { throw new Error('invalid query'); });
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue({
      datasource: {
        query: mockQuery as DataSource['query'],
      } as DataSource,
    } as DataSourceContextType);

    render(<SQLEditor />);

    const queryText = screen.getByRole('textbox');
    await userEvent.type(queryText, 'SELECT * from accounts');

    const runButton = screen.getByText('Run');
    await userEvent.click(runButton);

    screen.getByText('invalid query');
  });
});
