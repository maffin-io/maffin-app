import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';

import Table from '@/components/Table';
import { PricesTable } from '@/components/pages/commodity';
import type { Price } from '@/book/entities';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));

describe('PricesTable', () => {
  it('creates empty table with expected params', async () => {
    render(<PricesTable prices={[]} />);

    await screen.findByTestId('Table');
    expect((Table as jest.Mock)).toHaveBeenLastCalledWith(
      {
        id: 'prices-table',
        initialSort: {
          desc: true,
          id: 'date',
        },
        pageSize: 7,
        data: [],
        columns: [
          {
            header: 'Date',
            id: 'date',
            accessorFn: expect.any(Function),
            cell: expect.any(Function),
          },
          {
            header: 'Rate',
            enableSorting: false,
            accessorFn: expect.any(Function),
          },
        ],
      },
      {},
    );
    expect(
      (Table as jest.Mock).mock.calls[0][0].columns[0].accessorFn({ date: DateTime.fromISO('2023-01-01') }),
    ).toEqual(1672531200000);
    expect(
      (Table as jest.Mock).mock.calls[0][0].columns[1].accessorFn({
        value: 100.50,
        fk_currency: {
          mnemonic: 'USD',
        },
      }),
    ).toEqual('$100.50');
  });

  it('forwards prices as data', async () => {
    const prices = [
      {
        guid: '1',
        value: 100,
      } as Price,
    ];

    render(<PricesTable prices={prices} />);

    expect((Table as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: prices,
      }),
      {},
    );
  });
});
