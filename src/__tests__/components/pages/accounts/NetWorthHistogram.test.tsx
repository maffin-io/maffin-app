import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import NetWorthHistogram from '@/components/pages/accounts/NetWorthHistogram';
import * as apiHook from '@/hooks/api';
import type { Commodity } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('NetWorthHistogram', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccountsMonthlyWorth').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
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
          labels: [
            DateTime.now().minus({ months: 6 }),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            DateTime.fromISO('2022-12-01'),
          ],
        },
        options: {
          layout: {
            padding: {
              right: 15,
            },
          },
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
              grace: 1,
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
    jest.spyOn(apiHook, 'useAccountsMonthlyWorth').mockReturnValue(
      {
        data: [
          {
            type_asset: new Money(0, 'EUR'),
            type_liability: new Money(0, 'EUR'),
          },
          {
            type_asset: new Money(0, 'EUR'),
            type_liability: new Money(0, 'EUR'),
          },
          {
            type_asset: new Money(0, 'EUR'),
            type_liability: new Money(0, 'EUR'),
          },
          {
            type_asset: new Money(0, 'EUR'),
            type_liability: new Money(0, 'EUR'),
          },
          {
            type_asset: new Money(800, 'EUR'),
            type_liability: new Money(-200, 'EUR'),
          },
          {
            type_asset: new Money(1200, 'EUR'),
            type_liability: new Money(-200, 'EUR'),
          },
          {
            type_asset: new Money(1200, 'EUR'),
            type_liability: new Money(-200, 'EUR'),
          },
        ] as AccountsTotals[],
      } as UseQueryResult<AccountsTotals[]>,
    );

    render(
      <NetWorthHistogram selectedDate={DateTime.fromISO('2023-01-30')} />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [0, 0, 0, 0, 800, 1200, 1200],
              label: 'Assets',
            }),
            expect.objectContaining({
              data: [0, 0, 0, 0, -200, -200, -200],
              label: 'Liabilities',
            }),
            expect.objectContaining({
              data: [0, 0, 0, 0, 600, 1000, 1000],
              label: 'Net worth',
            }),
          ],
          labels: [
            DateTime.fromISO('2022-07-01'),
            DateTime.fromISO('2022-08-01'),
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
