import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import NetWorthHistogram from '@/components/pages/accounts/NetWorthHistogram';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('NetWorthHistogram', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02') as DateTime<true>);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('renders with no data', () => {
    render(
      <NetWorthHistogram />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: '400',
        data: {
          datasets: [
            {
              backgroundColor: '#06B6D4',
              data: [],
              label: 'Assets',
              order: 1,
              barPercentage: 0.6,
            },
          ],
          labels: [],
        },
        options: {
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
          },
          plugins: {
            title: {
              align: 'start',
              display: true,
              text: 'Net Worth',
              font: {
                size: 18,
              },
              padding: {
                bottom: 30,
                top: 0,
              },
            },
            zoom: {
              limits: {
                x: {
                  min: undefined,
                  max: 1672617600000,
                  minRange: 22032000000,
                },
              },
              pan: {
                mode: 'x',
                enabled: true,
              },
              zoom: {
                mode: 'x',
                wheel: {
                  enabled: true,
                  modifierKey: 'meta',
                },
              },
            },
            legend: {
              onClick: expect.any(Function),
              labels: {
                boxHeight: 8,
                boxWidth: 8,
                pointStyle: 'circle',
                usePointStyle: true,
              },
              position: 'bottom',
            },
            tooltip: {
              backgroundColor: '#323b44',
              callbacks: {
                label: expect.any(Function),
                labelColor: expect.any(Function),
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
              min: DateTime.now().minus({ months: 8 })
                .startOf('month').minus({ days: 5 })
                .toMillis(),
              max: DateTime.now().startOf('month').plus({ days: 5 }).toMillis(),
              ticks: {
                align: 'center',
              },
              time: {
                displayFormats: {
                  month: 'MMM-yy',
                },
                tooltipFormat: 'MMMM yyyy',
                unit: 'month',
              },
              type: 'time',
            },
            y: {
              border: {
                display: false,
              },
              position: 'left',
              ticks: {
                callback: expect.any(Function),
                maxTicksLimit: 10,
              },
            },
          },
        },
      },
      {},
    );
  });

  it('generates datasets as expected', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          asset: {
            '11/2022': new Money(800, 'EUR'),
            '12/2022': new Money(400, 'EUR'),
          },
          liability: {
            '11/2022': new Money(-200, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(
      <NetWorthHistogram
        startDate={DateTime.fromISO('2022-09-01')}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [0, 0, 800, 1200, 1200],
              label: 'Assets',
            }),
            expect.objectContaining({
              data: [0, 0, -200, -200, -200],
              label: 'Liabilities',
            }),
            expect.objectContaining({
              data: [0, 0, 600, 1000, 1000],
              label: 'Net worth',
            }),
          ],
          labels: [
            DateTime.fromISO('2022-09-01'),
            DateTime.fromISO('2022-10-01'),
            DateTime.fromISO('2022-11-01'),
            DateTime.fromISO('2022-12-01'),
            DateTime.fromISO('2023-01-01'),
          ],
        },
      }),
      {},
    );
  });
});
