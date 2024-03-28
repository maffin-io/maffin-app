import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { Account, Commodity } from '@/book/entities';
import Bar from '@/components/charts/Bar';
import { MonthlyTotalHistogram } from '@/components/charts';
import * as apiHook from '@/hooks/api';
import * as stateHooks from '@/hooks/state';
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

describe('MonthlyTotalHistogram', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-01') as DateTime<true>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals[]>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Bar with no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);

    render(
      <MonthlyTotalHistogram
        title="Title"
        guids={[]}
      />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: '400',
        data: {
          datasets: [],
          labels: [
            TEST_INTERVAL.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            TEST_INTERVAL.end?.startOf('day'),
          ],
        },
        options: {
          maintainAspectRatio: false,
          hover: {
            mode: 'dataset',
            intersect: true,
          },
          scales: {
            x: {
              type: 'time',
              stacked: true,
              time: {
                unit: 'month',
                displayFormats: {
                  month: 'MMM-yy',
                },
              },
              grid: {
                display: false,
              },
              ticks: {
                align: 'center',
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
            title: {
              display: true,
              text: 'Title',
              align: 'start',
              padding: {
                top: 0,
                bottom: 30,
              },
              font: {
                size: 18,
              },
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

    const { plugins } = (Bar as jest.Mock).mock.calls[0][0].options;
    expect(plugins.tooltip.backgroundColor({ tooltip: { labelColors: [{ backgroundColor: '#111' }] } })).toEqual('#111');
    expect(plugins.tooltip.callbacks.title()).toEqual('');
    expect(plugins.tooltip.callbacks.label({ dataset: { label: 'label' }, raw: 100 })).toEqual('label: €100.00');
  });

  it('generates data as expected', () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'salary',
            name: 'Salary',
            type: 'INCOME',
          } as Account,
          {
            guid: 'dividends',
            name: 'Dividends',
            type: 'INCOME',
          } as Account,
        ],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue(
      {
        data: [
          {
            salary: new Money(0, 'EUR'),
            dividends: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            salary: new Money(0, 'EUR'),
            dividends: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            salary: new Money(0, 'EUR'),
            dividends: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            salary: new Money(0, 'EUR'),
            dividends: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            salary: new Money(1000, 'EUR'),
            dividends: new Money(150, 'EUR'),
          } as AccountsTotals,
          {
            salary: new Money(1000, 'EUR'),
            dividends: new Money(50, 'EUR'),
          } as AccountsTotals,
        ],
      } as UseQueryResult<AccountsTotals[]>,
    );

    render(
      <MonthlyTotalHistogram
        title="Title"
        guids={['salary', 'dividends']}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              data: [0, 0, 0, 0, 1000, 1000],
              label: 'Salary',
            },
            {
              data: [0, 0, 0, 0, 150, 50],
              label: 'Dividends',
            },
          ],
          labels: expect.any(Array),
        },
      }),
      {},
    );
  });

  /**
   * Due to eventual consistency in state, sometimes it may be that
   * an interval of X months is passed but the monthlyTotals are with less
   * data points because it still has the previous query loaded.
   */
  it('works when less totals than amount of dates', () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'salary',
            name: 'Salary',
            type: 'INCOME',
          } as Account,
          {
            guid: 'dividends',
            name: 'Dividends',
            type: 'INCOME',
          } as Account,
        ],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue(
      {
        data: [
          {
            salary: new Money(1000, 'EUR'),
            dividends: new Money(50, 'EUR'),
          } as AccountsTotals,
        ],
      } as UseQueryResult<AccountsTotals[]>,
    );

    render(
      <MonthlyTotalHistogram
        title="Title"
        guids={['salary', 'dividends']}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              data: [1000],
              label: 'Salary',
            },
            {
              data: [50],
              label: 'Dividends',
            },
          ],
          labels: expect.any(Array),
        },
      }),
      {},
    );
  });
});
