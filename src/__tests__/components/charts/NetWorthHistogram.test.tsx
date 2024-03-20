import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import { NetWorthHistogram } from '@/components/charts';
import * as apiHook from '@/hooks/api';
import * as stateHooks from '@/hooks/state';
import type { Commodity } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('NetWorthHistogram', () => {
  let interval: Interval;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccountsMonthlyWorth').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);

    interval = Interval.fromDateTimes(
      DateTime.now().minus({ months: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    );
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: interval } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('renders with no loaded data', () => {
    render(
      <NetWorthHistogram
        assetsGuid=""
        liabilitiesGuid=""
      />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: 400,
        data: {
          datasets: [
            {
              backgroundColor: '#06B6D4',
              data: [],
              label: 'Assets',
              order: 1,
              barPercentage: 0.6,
            },
            {
              backgroundColor: '#0E7490',
              borderColor: '#0E7490',
              data: [],
              label: 'Net worth',
              order: 0,
              pointHoverRadius: 10,
              pointRadius: 5,
              pointStyle: 'rectRounded',
              type: 'line',
              datalabels: {
                align: 'end',
                backgroundColor: '#0E7490FF',
                borderRadius: 5,
                color: '#FFF',
                display: expect.any(Function),
                formatter: expect.any(Function),
              },
            },
          ],
          labels: [
            DateTime.now().minus({ months: 6 }),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            DateTime.fromISO('2023-01-01'),
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
              display: true,
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
              beginAtZero: false,
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

    const { plugins } = (Bar as jest.Mock).mock.calls[0][0].options;
    expect(plugins.tooltip.callbacks.label({ dataset: { label: 'label' }, raw: 100 })).toEqual('label: €100.00');
    expect(plugins.tooltip.callbacks.labelColor(
      { dataset: { backgroundColor: '#111' } },
    )).toEqual({
      borderColor: '#323b44',
      backgroundColor: '#111',
      borderWidth: 3,
      borderRadius: 2,
    });
  });

  it('renders with no data', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyWorth').mockReturnValue({ data: [{}, {}] } as UseQueryResult<AccountsTotals[]>);

    render(
      <NetWorthHistogram
        assetsGuid=""
        liabilitiesGuid=""
      />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: 400,
        data: {
          datasets: [
            {
              backgroundColor: '#06B6D4',
              data: [0, 0],
              label: 'Assets',
              order: 1,
              barPercentage: 0.6,
            },
            {
              backgroundColor: '#0E7490',
              borderColor: '#0E7490',
              data: [0, 0],
              label: 'Net worth',
              order: 0,
              pointHoverRadius: 10,
              pointRadius: 5,
              pointStyle: 'rectRounded',
              type: 'line',
              datalabels: {
                align: 'end',
                backgroundColor: '#0E7490FF',
                borderRadius: 5,
                color: '#FFF',
                display: expect.any(Function),
                formatter: expect.any(Function),
              },
            },
          ],
          labels: [
            DateTime.now().minus({ months: 6 }),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            DateTime.fromISO('2023-01-01'),
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
              display: true,
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
              beginAtZero: false,
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

  it('hides assets and liabilities', () => {
    render(
      <NetWorthHistogram
        assetsGuid=""
        hideAssets
        liabilitiesGuid=""
        hideLiabilities
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            expect.objectContaining({
              label: 'Net worth',
            }),
          ],
        }),
      }),
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
      <NetWorthHistogram
        assetsGuid="type_asset"
        liabilitiesGuid="type_liability"
      />,
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
