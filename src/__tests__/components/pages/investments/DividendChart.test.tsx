import React from 'react';
import { DateTime } from 'luxon';
import { render, act } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import Bar from '@/components/charts/Bar';
import { DividendChart } from '@/components/pages/investments';
import * as apiHook from '@/hooks/api';
import type { Commodity } from '@/book/entities';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('DividendChart', () => {
  const now = DateTime.fromISO('2023-01-02');

  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(now as DateTime<true>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Bar with no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);

    render(
      <DividendChart />,
    );

    expect(Bar).toBeCalledTimes(2);
    expect(Bar).toHaveBeenNthCalledWith(
      1,
      {
        height: '400',
        data: {
          datasets: [
            {
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              data: [0],
              hoverBackgroundColor: 'rgba(34, 197, 94, 0.5)',
            },
          ],
          labels: [2023],
        },
        options: {
          onClick: expect.any(Function),
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            datalabels: {
              display: false,
            },
            legend: {
              display: false,
            },
            tooltip: {
              displayColors: false,
              backgroundColor: expect.any(Function),
              callbacks: {
                title: expect.any(Function),
                label: expect.any(Function),
              },
            },
          },
          scales: {
            x: {
              grid: {
                drawOnChartArea: false,
              },
              border: {
                display: false,
              },
            },
            y: {
              border: {
                display: false,
              },
              grid: {
                display: false,
              },
            },
          },
        },
      },
      {},
    );

    expect(Bar).toHaveBeenNthCalledWith(
      2,
      {
        height: '400',
        data: {
          datasets: [],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
        options: {
          hover: {
            mode: 'dataset',
            intersect: true,
          },
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
            },
            y: {
              border: {
                display: false,
              },
              stacked: true,
              ticks: {
                maxTicksLimit: 5,
                callback: expect.any(Function),
              },
            },
          },
          plugins: {
            datalabels: {
              display: false,
            },
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
              },
            },
            tooltip: {
              displayColors: false,
              backgroundColor: expect.any(Function),
              callbacks: {
                title: expect.any(Function),
                label: expect.any(Function),
              },
            },
          },
        },
      },
      {},
    );
  });

  it('renders as expected with data', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue(
      {
        data: [
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
        ],
      } as UseQueryResult<InvestmentAccount[]>,
    );

    const { container } = render(<DividendChart />);

    expect(Bar).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [150, 360],
            }),
          ],
          labels: [2022, 2023],
        },
      }),
      {},
    );

    expect(Bar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            expect.objectContaining({
              label: 'Account1',
              data: [100, 0, 0, 0, 130, 0, 0, 0, 0, 0, 0, 0],
            }),
            expect.objectContaining({
              label: 'Account2',
              data: [0, 0, 0, 0, 130, 0, 0, 0, 0, 0, 0, 0],
            }),
          ],
        }),
      }),
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('recalculates monthly dataset on datapoint selection', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue(
      {
        data: [
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
        ],
      } as UseQueryResult<InvestmentAccount[]>,
    );

    render(<DividendChart />);

    act(() => {
      (Bar as jest.Mock).mock.calls[0][0].options.onClick(
        {},
        [{ index: 0 }],
        {
          data: {
            labels: [2022, 2023],
          },
        },
      );
    });

    expect(Bar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            expect.objectContaining({
              label: 'Account1',
              data: [130, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }),
          ],
        }),
      }),
      {},
    );

    expect(Bar).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            expect.objectContaining({
              label: 'Account1',
              data: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }),
          ],
        }),
      }),
      {},
    );
  });

  it('recalculates monthly with dividend on same ticker/month', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue(
      {
        data: [
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
        ],
      } as UseQueryResult<InvestmentAccount[]>,
    );

    render(<DividendChart />);

    expect(Bar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            expect.objectContaining({
              label: 'Account1',
              data: [230, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }),
          ],
        }),
      }),
      {},
    );
  });
});
