import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnDef } from '@tanstack/react-table';

import Table from '@/components/Table';

type TestDataType = {
  name: string;
  amount: number;
  extra?: {
    info: string;
  };
};

const columns: ColumnDef<TestDataType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
  {
    header: 'Info',
    accessorFn: (data: TestDataType) => data.extra?.info,
    enableSorting: false,
    cell: ({ getValue }) => (
      <span>
        {getValue<string>()}
      </span>
    ),
  },
];

describe('Table', () => {
  it('renders headers with empty data', () => {
    const { container } = render(
      <Table<TestDataType>
        id="table"
        columns={columns}
        data={[]}
      />,
    );

    screen.getByText('Name');
    screen.getByText('Amount');
    expect(container).toMatchSnapshot();
  });

  it('displays data', () => {
    render(
      <Table<TestDataType>
        id="table"
        columns={columns}
        data={[
          {
            name: 'name1',
            amount: 100,
          },
          {
            name: 'name2',
            amount: 200,
            extra: {
              info: 'info',
            },
          },
        ]}
      />,
    );

    screen.getByText('name1');
    screen.getByText('100');

    screen.getByText('name2');
    screen.getByText('200');
    screen.getByText('info');
  });

  it('can sort', async () => {
    render(
      <Table<TestDataType>
        id="table"
        columns={columns}
        data={[
          {
            name: 'name1',
            amount: 100,
          },
          {
            name: 'name2',
            amount: 200,
            extra: {
              info: 'info',
            },
          },
        ]}
      />,
    );

    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('name1100');
    expect(rows[2]).toHaveTextContent('name2200info');

    await userEvent.click(screen.getByText('Amount'));

    rows = screen.getAllByRole('row');
    expect(rows[2]).toHaveTextContent('name1100');
    expect(rows[1]).toHaveTextContent('name2200info');
  });

  it('can provide default sort', async () => {
    render(
      <Table<TestDataType>
        id="table"
        columns={columns}
        data={[
          {
            name: 'name2',
            amount: 200,
          },
          {
            name: 'name1',
            amount: 100,
          },
        ]}
        initialSort={{ id: 'name', desc: true }}
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows[2]).toHaveTextContent('name1100');
    expect(rows[1]).toHaveTextContent('name2200');
  });
});
