import React from 'react';
import { render, screen } from '@testing-library/react';

import AccountsTable, { Record } from '@/components/AccountsTable';
import type { TableProps } from '@/components/Table';
import { PriceDBMap } from '@/book/prices';
import { Account } from '@/book/entities';
import Money from '@/book/Money';

jest.mock('@/components/Table', () => {
  function Table({ columns, data, initialSort }: TableProps<Record>) {
    return (
      <div data-testid="AccountsTable" className="Table">
        <span>{JSON.stringify(columns)}</span>
        <span data-testid="data">{JSON.stringify(data)}</span>
        <span>{JSON.stringify(initialSort)}</span>
      </div>
    );
  }

  return Table;
});

describe('AccountsTable', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders empty table when no accounts', async () => {
    const { container } = render(
      <AccountsTable
        accounts={[]}
        todayPrices={new PriceDBMap()}
      />,
    );

    await screen.findByTestId('AccountsTable');
    expect(container).toMatchSnapshot();
  });

  it('renders empty table when no price data', async () => {
    const { container } = render(
      <AccountsTable
        accounts={[{} as Account]}
        todayPrices={new PriceDBMap()}
      />,
    );

    await screen.findByTestId('AccountsTable');
    expect(container).toMatchSnapshot();
  });

  it('builds subRows as expected with non investment accounts', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        total: new Money(10, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'Bank',
        total: new Money(1000, 'USD'),
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
    ];

    const { container } = render(
      <AccountsTable
        accounts={accounts}
        todayPrices={{
          getPrice: (from, to, date) => ({
            guid: `${from}.${to}.${date}`,
            value: 0.98,
          }),
        } as PriceDBMap}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('builds subRows as expected with investment accounts', async () => {
    const accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      {
        guid: 'a1',
        name: 'Stocks',
        total: new Money(0, 'EUR'),
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      {
        guid: 'a2',
        name: 'GOOGL',
        total: new Money(2, 'GOOGL'),
        commodity: {
          mnemonic: 'GOOGL',
        },
        type: 'STOCK',
        childrenIds: [] as string[],
      } as Account,
    ];

    const { container } = render(
      <AccountsTable
        accounts={accounts}
        todayPrices={{
          getPrice: (from, to, date) => ({
            guid: `${from}.${to}.${date}`,
            value: 0.98,
          }),
          getStockPrice: (from, date) => ({
            guid: `${from}.${date}`,
            value: 100,
            currency: {
              mnemonic: 'USD',
            },
          }),
        } as PriceDBMap}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
