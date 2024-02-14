import React from 'react';
import { render } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { Account } from '@/book/entities';
import { QuoteInfo } from '@/book/types';
import { InvestmentAccount } from '@/book/models';
import WeightsChart from '@/components/pages/investments/WeightsChart';
import Tree from '@/components/charts/Tree';
import * as apiHook from '@/hooks/api';
import type { Commodity } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/charts/Tree', () => jest.fn(
  () => <div data-testid="Tree" />,
));

describe('WeightsChart', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates treemap with no data', () => {
    render(<WeightsChart totalValue={new Money(0, 'EUR')} />);

    expect(Tree).toHaveBeenCalledWith(
      {
        height: '625',
        data: {
          datasets: [
            {
              backgroundColor: expect.any(Function),
              borderWidth: 0,
              data: [],
              key: 'value',
              spacing: 0.25,
              tree: [],
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              color: 'white',
              font: expect.any(Function),
              formatter: expect.any(Function),
              textAlign: 'center',
            },
            tooltip: {
              backgroundColor: expect.any(Function),
              callbacks: {
                label: expect.any(Function),
                title: expect.any(Function),
              },
              displayColors: false,
            },
          },
        },
      },
      {},
    );
  });

  it('creates treemap with data as expected', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue(
      {
        data: [
          {
            quoteInfo: {
              changePct: -5,
            } as QuoteInfo,
            valueInCurrency: new Money(100, 'EUR'),
            account: {
              name: 'i1',
            } as Account,
          } as InvestmentAccount,
          {
            quoteInfo: {
              changePct: 5,
            } as QuoteInfo,
            valueInCurrency: new Money(300, 'EUR'),
            account: {
              name: 'i2',
            } as Account,
          } as InvestmentAccount,
          {
            quoteInfo: {
              changePct: 1,
            } as QuoteInfo,
            valueInCurrency: new Money(200, 'EUR'),
            account: {
              name: 'i3',
            } as Account,
          } as InvestmentAccount,
        ],
      } as UseQueryResult<InvestmentAccount[]>,
    );

    render(<WeightsChart totalValue={new Money(600, 'EUR')} />);

    expect(Tree).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [],
              key: 'value',
              tree: [
                {
                  color: '#d12b2b',
                  pct: 16.67,
                  today: '-5%',
                  ticker: 'i1',
                  value: 100,
                },
                {
                  color: '#52b12c',
                  pct: 50,
                  today: '+5%',
                  ticker: 'i2',
                  value: 300,
                },
                {
                  color: '#a4d690',
                  pct: 33.33,
                  today: '+1%',
                  ticker: 'i3',
                  value: 200,
                },
              ],
            }),
          ],
        },
      }),
      {},
    );
  });
});
