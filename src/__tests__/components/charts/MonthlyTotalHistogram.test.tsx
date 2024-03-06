import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { Account, Commodity } from '@/book/entities';
import Bar from '@/components/charts/Bar';
import { MonthlyTotalHistogram } from '@/components/charts';
import * as apiHook from '@/hooks/api';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('MonthlyTotalHistogram', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-01') as DateTime<true>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotal').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals[]>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
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
            DateTime.fromISO('2022-07-01').startOf('day'),
            DateTime.fromISO('2022-08-01').startOf('day'),
            DateTime.fromISO('2022-09-01').startOf('day'),
            DateTime.fromISO('2022-10-01').startOf('day'),
            DateTime.fromISO('2022-11-01').startOf('day'),
            DateTime.fromISO('2022-12-01').startOf('day'),
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

  it('uses custom interval', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotal').mockReturnValue(
      {
        data: [
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
          {
            salary: new Money(0, 'EUR'),
          },
        ] as AccountsTotals[],
      } as UseQueryResult<AccountsTotals[]>,
    );
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [{ guid: 'salary', name: 'Salary' } as Account],
      } as UseQueryResult<Account[]>,
    );

    render(
      <MonthlyTotalHistogram
        title="Title"
        interval={Interval.fromDateTimes(
          DateTime.now().minus({ month: 2 }).startOf('month'),
          DateTime.now(),
        )}
        guids={['salary']}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: expect.any(Array),
          labels: [
            DateTime.now().minus({ months: 2 }).startOf('month'),
            DateTime.now().minus({ months: 1 }).startOf('month'),
          ],
        },
      }),
      {},
    );
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
    jest.spyOn(apiHook, 'useAccountsMonthlyTotal').mockReturnValue(
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
});
