import React from 'react';
import { render, screen } from '@testing-library/react';
import type { DataSource, BaseEntity } from 'typeorm';

import AccountsTable, { Record } from '@/components/AccountsTable';
import type { TableProps } from '@/components/Table';
import { PriceDB, PriceDBMap } from '@/book/prices';
import { Book, Account } from '@/book/entities';
import Money from '@/book/Money';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

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
  let mockGetTodayQuotes: jest.SpyInstance;

  beforeEach(() => {
    mockGetTodayQuotes = jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue({
      getPrice: (from, to, date) => ({
        guid: 'price_guid',
        value: 0.98,
      }),
    } as PriceDBMap);
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([null]);
    jest.spyOn(Book, 'find').mockResolvedValue([
      {
        // @ts-ignore
        root: {
          name: 'Root',
          currency: Promise.resolve(null),
          total: null,
          type: 'ROOT',
        } as Account,
      },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders empty when no dataSource', () => {
    const { container } = render(<AccountsTable />);

    expect(container).toMatchSnapshot();
  });

  it('renders message when no accounts', async () => {
    // @ts-ignore
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{
      manager: {
        getTreeRepository: (e: BaseEntity) => ({
          findDescendantsTree: async () => ({
            name: 'Root',
            currency: null,
            total: null,
            type: 'ROOT',
            children: [],
          }),
        }),
      },
    } as DataSource]);
    render(<AccountsTable />);

    await screen.findByText('Add accounts to start seeing some data!');
  });

  it('builds subRows as expected with non investment accounts', async () => {
    // @ts-ignore
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{
      manager: {
        getTreeRepository: (e: BaseEntity) => ({
          findDescendantsTree: async () => ({
            name: 'Root',
            currency: null,
            total: null,
            type: 'ROOT',
            children: [
              {
                name: 'Assets',
                total: new Money(10, 'EUR'),
                currency: {
                  mnemonic: 'EUR',
                },
                commodity: {
                  mnemonic: 'EUR',
                },
                type: 'ASSET',
                children: [
                  {
                    name: 'Bank',
                    total: new Money(1000, 'USD'),
                    currency: {
                      mnemonic: 'USD',
                    },
                    commodity: {
                      mnemonic: 'USD',
                    },
                    type: 'BANK',
                    children: [],
                  },
                ],
              },
            ],
          }),
        }),
      },
    } as DataSource]);

    const { container } = render(<AccountsTable />);
    await screen.findByTestId('data');

    expect(container).toMatchSnapshot();
    expect(mockGetTodayQuotes).toBeCalledTimes(1);
  });

  it('builds subRows as expected with investment accounts', async () => {
    mockGetTodayQuotes = jest.spyOn(PriceDB, 'getTodayQuotes').mockResolvedValue({
      getPrice: (from, to, date) => ({
        guid: 'price_guid',
        value: 0.98,
      }),
      getStockPrice: (from, date) => ({
        guid: 'stock_price_guid',
        value: 100,
        currency: {
          mnemonic: 'USD',
        },
      }),
    } as PriceDBMap);
    // @ts-ignore
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{
      manager: {
        getTreeRepository: (e: BaseEntity) => ({
          findDescendantsTree: async () => ({
            name: 'Root',
            currency: null,
            total: null,
            type: 'ROOT',
            children: [
              {
                name: 'Stocks',
                total: new Money(0, 'EUR'),
                currency: {
                  mnemonic: 'EUR',
                },
                commodity: {
                  mnemonic: 'EUR',
                },
                type: 'ASSET',
                children: [
                  {
                    name: 'GOOGL',
                    total: new Money(2, 'GOOGL'),
                    currency: {
                      mnemonic: 'USD',
                    },
                    commodity: {
                      mnemonic: 'GOOGL',
                    },
                    type: 'STOCK',
                    children: [],
                  },
                ],
              },
            ],
          }),
        }),
      },
    } as DataSource]);

    const { container } = render(<AccountsTable />);
    await screen.findByTestId('data');

    expect(container).toMatchSnapshot();
    expect(mockGetTodayQuotes).toBeCalledTimes(1);
  });
});
