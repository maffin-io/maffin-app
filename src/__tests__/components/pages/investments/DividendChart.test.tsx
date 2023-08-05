import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';

import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import Chart from '@/components/charts/Chart';
import DividendChart from '@/components/pages/investments/DividendChart';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));
const ChartMock = Chart as jest.MockedFunction<typeof Chart>;

const mockChartExec = jest.fn();
Object.defineProperty(global.self, 'ApexCharts', {
  value: {
    exec: (arg1: string, arg2: string, arg3: object) => mockChartExec(arg1, arg2, arg3),
  },
});

describe('DividendChart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when no data', () => {
    render(<DividendChart investments={[]} />);

    screen.getByText('Loading...');
  });

  it('renders as expected with data', () => {
    const { container } = render(
      <DividendChart
        investments={
          [
            {
              mainCurrency: 'EUR',
              account: {
                name: 'Account1',
              },
              dividends: [
                {
                  when: DateTime.fromISO('2023-01-01'),
                  amountInCurrency: new Money(100, 'EUR'),
                },
                {
                  when: DateTime.fromISO('2023-05-01'),
                  amountInCurrency: new Money(130, 'EUR'),
                },
              ],
            } as InvestmentAccount,
            {
              account: {
                name: 'Account2',
              },
              dividends: [
                {
                  when: DateTime.fromISO('2022-02-02'),
                  amountInCurrency: new Money(150, 'EUR'),
                },
                {
                  when: DateTime.fromISO('2023-05-20'),
                  amountInCurrency: new Money(130, 'EUR'),
                },
              ],
            } as InvestmentAccount,
          ]
        }
      />,
    );

    expect(Chart).toHaveBeenNthCalledWith(
      1,
      {
        series: [
          {
            name: 'dividends',
            data: [
              {
                dividends: {
                  Feb: [
                    {
                      amount: 150,
                      ticker: 'Account2',
                    },
                  ],
                },
                x: '2022',
                y: 150,
              },
              {
                dividends: {
                  Jan: [
                    {
                      amount: 100,
                      ticker: 'Account1',
                    },
                  ],
                  May: [
                    {
                      amount: 130,
                      ticker: 'Account1',
                    },
                    {
                      amount: 130,
                      ticker: 'Account2',
                    },
                  ],
                },
                x: '2023',
                y: 360,
              },
            ],
          },
        ],
        type: 'bar',
        unit: 'EUR',
        options: {
          legend: {
            show: false,
          },
          chart: {
            events: {
              dataPointSelection: expect.any(Function),
            },
          },
          plotOptions: {
            bar: {
              barHeight: '55%',
              horizontal: true,
            },
          },
        },
      },
      {},
    );

    expect(Chart).toHaveBeenNthCalledWith(
      2,
      {
        type: 'bar',
        unit: 'EUR',
        series: [
          {
            name: 'Account1',
            data: [100, 0, 0, 0, 130, 0, 0, 0, 0, 0, 0, 0],
          },
          {
            name: 'Account2',
            data: [0, 0, 0, 0, 130, 0, 0, 0, 0, 0, 0, 0],
          },
        ],
        options: {
          chart: {
            id: 'barMonthly',
            stacked: true,
          },
          xaxis: {
            categories: [
              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
            ],
          },
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('recalculates monthly series on datapoint selection', () => {
    render(
      <DividendChart
        investments={
          [
            {
              mainCurrency: 'EUR',
              account: {
                name: 'Account1',
              },
              dividends: [
                {
                  when: DateTime.fromISO('2022-01-01'),
                  amountInCurrency: new Money(100, 'EUR'),
                },
                {
                  when: DateTime.fromISO('2023-01-01'),
                  amountInCurrency: new Money(130, 'EUR'),
                },
              ],
            } as InvestmentAccount,
          ]
        }
      />,
    );

    const dataPointSelection = (
      ChartMock.mock.calls[0][0].options?.chart?.events?.dataPointSelection as Function
    );

    const mockChart = {
      w: {
        globals: {
          selectedDataPoints: [[0]],
        },
        config: {
          series: [
            {
              name: 'dividends',
              data: [
                {
                  dividends: {
                    Jan: [
                      {
                        amount: 100,
                        ticker: 'Account1',
                      },
                    ],
                  },
                  x: '2022',
                  y: 100,
                },
                {
                  dividends: {
                    Jan: [
                      {
                        amount: 130,
                        ticker: 'Account1',
                      },
                    ],
                  },
                  x: '2023',
                  y: 130,
                },
              ],
            },
          ],
        },
      },
    };
    dataPointSelection(jest.fn(), mockChart);
    expect(mockChartExec).toBeCalledWith(
      'barMonthly',
      'updateOptions',
      {
        series: [
          {
            data: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            name: 'Account1',
          },
        ],
      },
    );
  });

  it('recalculates monthly with dividend on same ticker/month', () => {
    render(
      <DividendChart
        investments={
          [
            {
              mainCurrency: 'EUR',
              account: {
                name: 'Account1',
              },
              dividends: [
                {
                  when: DateTime.fromISO('2023-01-01'),
                  amountInCurrency: new Money(100, 'EUR'),
                },
                {
                  when: DateTime.fromISO('2023-01-20'),
                  amountInCurrency: new Money(130, 'EUR'),
                },
              ],
            } as InvestmentAccount,
          ]
        }
      />,
    );

    const dataPointSelection = (
      ChartMock.mock.calls[0][0].options?.chart?.events?.dataPointSelection as Function
    );

    const mockChart = {
      w: {
        globals: {
          selectedDataPoints: [[0]],
        },
        config: {
          series: [
            {
              name: 'dividends',
              data: [
                {
                  dividends: {
                    Jan: [
                      {
                        amount: 100,
                        ticker: 'Account1',
                      },
                      {
                        amount: 130,
                        ticker: 'Account1',
                      },
                    ],
                  },
                  x: '2023',
                  y: 230,
                },
              ],
            },
          ],
        },
      },
    };
    dataPointSelection(jest.fn(), mockChart);
    expect(mockChartExec).toBeCalledWith(
      'barMonthly',
      'updateOptions',
      {
        series: [
          {
            data: [230, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            name: 'Account1',
          },
        ],
      },
    );
  });
});
