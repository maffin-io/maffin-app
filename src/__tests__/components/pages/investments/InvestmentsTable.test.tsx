import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import Table from '@/components/Table';
import { InvestmentsTable } from '@/components/pages/investments';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/Table', () => jest.fn(
  () => <div data-testid="Table" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('InvestmentsTable', () => {
  it('creates empty Table with expected params', async () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount[]>);

    render(<InvestmentsTable />);

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      {
        id: 'investments-table',
        columns: [
          {
            accessorFn: expect.any(Function),
            header: 'Ticker',
            id: 'ticker',
            enableSorting: false,
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Latest',
            id: 'latest',
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Value/Cost',
            id: 'value/cost',
            enableSorting: false,
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Unrealized Profit',
            id: 'unrealizedProfit',
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Value/Cost (in )',
            id: 'valueInCurrency',
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Unrealized profit (in )',
            id: 'unrealizedProfitInCurrency',
            cell: expect.any(Function),
          },
          {
            accessorFn: expect.any(Function),
            header: 'Realized/Dividends',
            id: 'realized',
            enableSorting: false,
            cell: expect.any(Function),
          },
        ],
        data: [],
        initialState: {
          sorting: [{ id: 'unrealizedProfit', desc: true }],
        },
      },
      {},
    );
  });

  it('ignores positions with no shares (fully sold)', async () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue(
      {
        data: [
          {
            account: { name: 'Investment' },
            isClosed: true,
          } as InvestmentAccount,
        ],
      } as UseQueryResult<InvestmentAccount[]>,
    );

    render(<InvestmentsTable />);

    await screen.findByTestId('Table');
    expect(Table).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: [],
      }),
      {},
    );
  });
});
