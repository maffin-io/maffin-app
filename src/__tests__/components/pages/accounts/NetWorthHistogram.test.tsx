import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import { NetWorthHistogram } from '@/components/pages/accounts';
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
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
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
        data: {
          datasets: [
            {
              backgroundColor: '#06B6D4',
              borderColor: '#06B6D4',
              data: [],
              label: 'Net worth',
              pointHoverRadius: 10,
              pointRadius: 5,
              pointStyle: 'rectRounded',
              showLine: false,
              type: 'line',
              yAxisID: 'y1',
            },
            {
              backgroundColor: '#22C55E',
              data: [],
              label: 'Income',
            },
            {
              backgroundColor: '#EF4444',
              data: [],
              label: 'Expenses',
            },
            {
              backgroundColor: '#06B6D4',
              data: [],
              label: 'Net profit',
            },
          ],
          labels: [],
        },
        options: {
          interaction: {
            mode: 'index',
          },
          plugins: {
            legend: {
              labels: {
                boxHeight: 8,
                boxWidth: 8,
                pointStyle: 'circle',
                usePointStyle: true,
              },
              position: 'top',
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
              grid: {
                display: false,
              },
              max: DateTime.now().startOf('month').toMillis(),
              min: DateTime.now().minus({ months: 8 }).startOf('month').toMillis(),
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
              title: {
                display: true,
                text: 'Monthly net profit',
              },
            },
            y1: {
              border: {
                display: false,
              },
              display: true,
              grid: {
                display: false,
                drawOnChartArea: false,
              },
              position: 'right',
              ticks: {
                callback: expect.any(Function),
                maxTicksLimit: 10,
              },
              title: {
                display: true,
                text: 'Accumulated net worth',
              },
              type: 'linear',
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
          income: {
            '11/2022': new Money(-600, 'EUR'),
            '12/2022': new Money(-400, 'EUR'),
          },
          equity: {
            '11/2022': new Money(-200, 'EUR'),
          },
          expense: {
            '11/2022': new Money(400, 'EUR'),
            '12/2022': new Money(500, 'EUR'),
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
              data: [0, 0, 400, 300, 300],
              label: 'Net worth',
            }),
            expect.objectContaining({
              data: [-0, -0, 800, 400, -0],
              label: 'Income',
            }),
            expect.objectContaining({
              data: [-0, -0, -400, -500, -0],
              label: 'Expenses',
            }),
            expect.objectContaining({
              data: [-0, -0, 400, -100, -0],
              label: 'Net profit',
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
