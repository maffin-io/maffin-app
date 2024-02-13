import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import { Account, Commodity } from '@/book/entities';
import Bar from '@/components/charts/Bar';
import { MonthlyTotalHistogram } from '@/components/pages/accounts';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('MonthlyTotalHistogram', () => {
  const now = DateTime.fromISO('2023-01-02') as DateTime<true>;

  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(now);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Bar with no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);

    render(
      <MonthlyTotalHistogram
        title="Title"
        accounts={[]}
      />,
    );

    expect(Bar).toBeCalledWith(
      {
        height: '400',
        data: {
          datasets: [],
          labels: [
            DateTime.fromISO('2022-05-01').startOf('day'),
            DateTime.fromISO('2022-06-01').startOf('day'),
            DateTime.fromISO('2022-07-01').startOf('day'),
            DateTime.fromISO('2022-08-01').startOf('day'),
            DateTime.fromISO('2022-09-01').startOf('day'),
            DateTime.fromISO('2022-10-01').startOf('day'),
            DateTime.fromISO('2022-11-01').startOf('day'),
            DateTime.fromISO('2022-12-01').startOf('day'),
            DateTime.fromISO('2023-01-01').startOf('day'),
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
  });

  // Checks that X range is computed as -8 months to now when
  // not selected date is passed
  it.each([
    undefined,
    now.minus({ months: 3 }),
  ])('selects default date now - 9 months', (date) => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          salary: {
            '11/2022': new Money(-1000, 'EUR'),
            '12/2022': new Money(-1000, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(
      <MonthlyTotalHistogram
        title="Title"
        selectedDate={date}
        accounts={[
          {
            guid: 'salary',
            name: 'Salary',
            type: 'INCOME',
          } as Account,
        ]}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: expect.any(Array),
          labels: [
            now.minus({ months: 8 }).startOf('month'),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            now.startOf('month'),
          ],
        },
      }),
      {},
    );
  });

  it('selects date range of 9 months in the past', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          salary: {
            '11/2021': new Money(-1000, 'EUR'),
            '12/2021': new Money(-1000, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    const selectedDate = now.minus({ years: 1 });
    render(
      <MonthlyTotalHistogram
        title="Title"
        selectedDate={selectedDate}
        accounts={[
          {
            guid: 'salary',
            name: 'Salary',
            type: 'INCOME',
          } as Account,
        ]}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: expect.any(Array),
          labels: [
            selectedDate.minus({ months: 4 }).startOf('month'),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            selectedDate.plus({ months: 4 }).startOf('month'),
          ],
        },
      }),
      {},
    );
  });

  it('generates data as expected', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          salary: {
            '11/2022': new Money(-1000, 'EUR'),
            '12/2022': new Money(-1000, 'EUR'),
          },
          dividends: {
            '11/2022': new Money(-150, 'EUR'),
            '12/2022': new Money(-50, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(
      <MonthlyTotalHistogram
        title="Title"
        accounts={[
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
        ]}
      />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              data: [-0, -0, -0, -0, -0, -0, 1000, 1000, -0],
              label: 'Salary',
            },
            {
              data: [-0, -0, -0, -0, -0, -0, 150, 50, -0],
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
