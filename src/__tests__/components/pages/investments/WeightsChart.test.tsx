import React from 'react';
import { render } from '@testing-library/react';

import Money from '@/book/Money';
import { Account } from '@/book/entities';
import { QuoteInfo } from '@/book/types';
import { InvestmentAccount } from '@/book/models';
import WeightsChart from '@/components/pages/investments/WeightsChart';
import Chart from '@/components/charts/Chart';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('WeightsChart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates treemap with empty data', () => {
    render(<WeightsChart investments={[]} totalValue={new Money(0, 'EUR')} />);

    expect(Chart).toHaveBeenCalledWith(
      {
        series: [{ data: [] }],
        type: 'treemap',
        height: 650,
        options: {
          dataLabels: {
            enabled: true,
            formatter: expect.any(Function),
            style: {
              fontSize: '12px',
            },
          },
          plotOptions: {
            treemap: {
              colorScale: {
                ranges: [],
              },
              useFillColorAsStroke: true,
            },
          },
          tooltip: {
            y: {
              formatter: expect.any(Function),
            },
          },
        },
      },
      {},
    );
  });

  it('creates treemap with data as expected', () => {
    render(
      <WeightsChart
        investments={[
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
        ]}
        totalValue={new Money(600, 'EUR')}
      />,
    );

    expect(Chart).toHaveBeenCalledWith(
      {
        height: 650,
        series: [
          {
            data: [
              {
                color: '#d12b2b',
                pct: 16.67,
                today: '-5%',
                x: 'i1',
                y: 100,
              },
              {
                color: '#52b12c',
                pct: 50,
                today: '+5%',
                x: 'i2',
                y: 300,
              },
              {
                color: '#a4d690',
                pct: 33.33,
                today: '+1%',
                x: 'i3',
                y: 200,
              },
            ],
          },
        ],
        type: 'treemap',
        options: {
          dataLabels: {
            enabled: true,
            formatter: expect.any(Function),
            style: {
              fontSize: '12px',
            },
          },
          plotOptions: {
            treemap: {
              colorScale: {
                ranges: [
                  {
                    color: '#d12b2b',
                    from: 100,
                    to: 100,
                  },
                  {
                    color: '#52b12c',
                    from: 300,
                    to: 300,
                  },
                  {
                    color: '#a4d690',
                    from: 200,
                    to: 200,
                  },

                ],
              },
              useFillColorAsStroke: true,
            },
          },
          tooltip: {
            y: {
              formatter: expect.any(Function),
            },
          },
        },
      },
      {},
    );
  });
});
