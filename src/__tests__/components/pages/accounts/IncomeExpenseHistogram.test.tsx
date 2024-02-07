import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import IncomeExpenseHistogram from '@/components/pages/accounts/IncomeExpenseHistogram';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('IncomeExpenseHistogram', () => {
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
      <IncomeExpenseHistogram />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: '400',
        data: {
          datasets: [
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
              label: 'Savings',
              datalabels: {
                clip: true,
                anchor: 'end',
                display: true,
                formatter: expect.any(Function),
                align: 'end',
                backgroundColor: '#06B6D466',
                borderRadius: 5,
                color: '#FFF',
              },
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
              text: 'Monthly Savings',
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
                  minRange: 21168000000,
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
      <IncomeExpenseHistogram
        startDate={DateTime.fromISO('2022-09-01')}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [-0, -0, 600, 400, -0],
              label: 'Income',
            }),
            expect.objectContaining({
              data: [-0, -0, -400, -500, -0],
              label: 'Expenses',
            }),
            expect.objectContaining({
              data: [-0, -0, 200, -100, -0],
              label: 'Savings',
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
