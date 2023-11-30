import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';

import Table from '@/components/Table';
import FormButton from '@/components/buttons/FormButton';
import PriceForm from '@/components/forms/price/PriceForm';
import { PricesTable } from '@/components/pages/commodity';
import type { Price } from '@/book/entities';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/price/PriceForm', () => jest.fn(
  () => <div data-testid="PriceForm" />,
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
          {
            header: 'Actions',
            enableSorting: false,
            cell: expect.any(Function),
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

  it('renders Actions column as expected', async () => {
    const prices = [
      {
        guid: '1',
        value: 100,
        date: DateTime.fromISO('2023-01-01'),
      } as Price,
    ];

    render(<PricesTable prices={prices} />);

    await screen.findByTestId('Table');
    const actionsCol = (Table as jest.Mock).mock.calls[0][0].columns[2];

    expect(actionsCol.cell).not.toBeUndefined();

    const { container } = render(
      // @ts-ignore
      actionsCol.cell({
        row: {
          original: prices[0],
        },
      }),
    );

    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        className: 'link',
        id: 'edit-price',
        modalTitle: 'Edit price',
      }),
      {},
    );
    expect(PriceForm).toHaveBeenNthCalledWith(
      1,
      {
        action: 'update',
        defaultValues: {
          date: '2023-01-01',
          fk_commodity: undefined,
          fk_currency: undefined,
          guid: '1',
          value: 100,
        },
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        className: 'link',
        id: 'delete-price',
        modalTitle: 'Confirm you want to remove this price',
      }),
      {},
    );
    expect(PriceForm).toHaveBeenNthCalledWith(
      2,
      {
        action: 'delete',
        defaultValues: {
          date: '2023-01-01',
          fk_commodity: undefined,
          fk_currency: undefined,
          guid: '1',
          value: 100,
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
