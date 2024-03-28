import React from 'react';
import { render } from '@testing-library/react';
import { DateTime, Interval } from 'luxon';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import IncomeExpenseHistogram from '@/components/pages/accounts/IncomeExpenseHistogram';
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

describe('IncomeExpenseHistogram', () => {
  let interval: Interval;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals[]>);
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
                anchor: 'end',
                display: expect.any(Function),
                formatter: expect.any(Function),
                align: 'end',
                backgroundColor: '#06B6D4FF',
                borderRadius: 5,
                color: '#FFF',
              },
            },
          ],
          labels: [
            interval.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            interval.end?.startOf('day'),
          ],
        },
        options: {
          layout: {
            padding: {
              right: 20,
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
              text: 'Monthly Savings',
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

  it('renders with no data', () => {
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue({ data: [{}, {}] } as UseQueryResult<AccountsTotals[]>);

    render(
      <IncomeExpenseHistogram />,
    );

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              backgroundColor: '#22C55E',
              data: [0, 0],
              label: 'Income',
            },
            {
              backgroundColor: '#EF4444',
              data: [0, 0],
              label: 'Expenses',
            },
            {
              backgroundColor: '#06B6D4',
              data: [0, 0],
              label: 'Savings',
              datalabels: {
                anchor: 'end',
                display: expect.any(Function),
                formatter: expect.any(Function),
                align: 'end',
                backgroundColor: '#06B6D4FF',
                borderRadius: 5,
                color: '#FFF',
              },
            },
          ],
          labels: [
            interval.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            interval.end?.startOf('day'),
          ],
        },
      }),
      {},
    );
  });

  it('generates datasets as expected', () => {
    jest.spyOn(apiHook, 'useMonthlyTotals').mockReturnValue(
      {
        data: [
          {
            type_income: new Money(0, 'EUR'),
            type_expense: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(0, 'EUR'),
            type_expense: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(0, 'EUR'),
            type_expense: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(0, 'EUR'),
            type_expense: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(0, 'EUR'),
            type_expense: new Money(0, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(600, 'EUR'),
            type_expense: new Money(400, 'EUR'),
          } as AccountsTotals,
          {
            type_income: new Money(400, 'EUR'),
            type_expense: new Money(500, 'EUR'),
          } as AccountsTotals,
        ],
      } as UseQueryResult<AccountsTotals[]>,
    );

    render(<IncomeExpenseHistogram />);

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            expect.objectContaining({
              data: [0, 0, 0, 0, 0, 600, 400],
              label: 'Income',
            }),
            expect.objectContaining({
              data: [0, 0, 0, 0, 0, -400, -500],
              label: 'Expenses',
            }),
            expect.objectContaining({
              data: [0, 0, 0, 0, 0, 200, -100],
              label: 'Savings',
            }),
          ],
          labels: [
            interval.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            interval.end?.startOf('day'),
          ],
        },
      }),
      {},
    );
  });
});
