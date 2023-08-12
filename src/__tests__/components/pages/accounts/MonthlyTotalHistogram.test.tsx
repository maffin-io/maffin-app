import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import { Account } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import { MonthlyTotalHistogram } from '@/components/pages/accounts';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('MonthlyTotalHistogram', () => {
  const now = DateTime.fromISO('2023-01-02');

  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty tree', () => {
    render(
      <MonthlyTotalHistogram
        title="Title"
        tree={undefined}
        monthlyTotals={{}}
      />,
    );

    expect(Chart).toBeCalledWith(
      {
        height: 300,
        type: 'bar',
        unit: undefined,
        series: [],
        options: {
          chart: {
            stacked: true,
          },
          colors: [
            '#2E93fA',
            '#66DA26',
            '#546E7A',
            '#E91E63',
            '#FF9800',
            '#9C27B0',
            '#00BCD4',
            '#4CAF50',
            '#FF5722',
            '#FFC107',
          ],
          plotOptions: {
            bar: {
              columnWidth: '60%',
            },
          },
          title: { text: 'Title' },
          xaxis: { type: 'datetime' },
        },
      },
      {},
    );
  });

  // Checks that X range is computed as -8 months to now when
  // not selected date is passed
  it.each(
    [undefined, now.minus({ months: 3 })],
  )('selects default date now - 8 months', (date) => {
    render(
      <MonthlyTotalHistogram
        title="Title"
        selectedDate={date}
        tree={
          {
            account: {
              guid: 'Income',
              type: 'INCOME',
              commodity: { mnemonic: 'EUR' },
            } as Account,
            leaves: [
              {
                account: {
                  guid: 'Salary',
                  name: 'Salary',
                  type: 'INCOME',
                  commodity: { mnemonic: 'EUR' },
                },
                leaves: [],
              },
            ],
          }
        }
        monthlyTotals={{
          Salary: {
            '11/2022': new Money(-1000, 'EUR'),
            '12/2022': new Money(-1000, 'EUR'),
          },
        }}
      />,
    );

    const { series } = (Chart as jest.Mock).mock.calls[0][0];
    expect(
      series[0].data[0].x,
    ).toEqual(now.minus({ months: 7 }).startOf('month').plus({ days: 1 }).toMillis());
    expect(
      series[0].data[series[0].data.length - 1].x,
    ).toEqual(now.startOf('month').plus({ days: 1 }).toMillis());
  });

  it('selects date range of 8 months in the past', () => {
    const selectedDate = now.minus({ years: 1 });
    render(
      <MonthlyTotalHistogram
        title="Title"
        selectedDate={selectedDate}
        tree={
          {
            account: {
              guid: 'Income',
              type: 'INCOME',
              commodity: { mnemonic: 'EUR' },
            } as Account,
            leaves: [
              {
                account: {
                  guid: 'Salary',
                  name: 'Salary',
                  type: 'INCOME',
                  commodity: { mnemonic: 'EUR' },
                },
                leaves: [],
              },
            ],
          }
        }
        monthlyTotals={{
          Salary: {
            '11/2021': new Money(-1000, 'EUR'),
            '12/2021': new Money(-1000, 'EUR'),
          },
        }}
      />,
    );

    const { series } = (Chart as jest.Mock).mock.calls[0][0];
    expect(
      series[0].data[0].x,
    ).toEqual(selectedDate.minus({ months: 3 }).startOf('month').plus({ days: 1 }).toMillis());
    expect(
      series[0].data[series[0].data.length - 1].x,
    ).toEqual(selectedDate.plus({ months: 4 }).startOf('month').plus({ days: 1 }).toMillis());
  });

  it('generates series from tree as expected', () => {
    render(
      <MonthlyTotalHistogram
        title="Title"
        tree={
          {
            account: {
              guid: 'Income',
              type: 'INCOME',
              commodity: { mnemonic: 'EUR' },
            } as Account,
            leaves: [
              {
                account: {
                  guid: 'Salary',
                  name: 'Salary',
                  type: 'INCOME',
                  commodity: { mnemonic: 'EUR' },
                },
                leaves: [],
              },
              {
                account: {
                  guid: 'Dividends',
                  name: 'Dividends',
                  type: 'INCOME',
                  commodity: { mnemonic: 'EUR' },
                },
                leaves: [],
              },
            ],
          }
        }
        monthlyTotals={{
          Salary: {
            '11/2022': new Money(-1000, 'EUR'),
            '12/2022': new Money(-1000, 'EUR'),
          },
          Dividends: {
            '11/2022': new Money(-150, 'EUR'),
            '12/2022': new Money(-50, 'EUR'),
          },
        }}
      />,
    );

    const { series, unit } = (Chart as jest.Mock).mock.calls[0][0];
    expect(unit).toEqual('EUR');
    expect(series).toEqual([
      {
        name: 'Salary',
        data: [
          {
            x: now.minus({ months: 7 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 6 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 5 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 4 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 3 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 2 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: 1000,
          },
          {
            x: now.minus({ months: 1 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: 1000,
          },
          {
            x: now.startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
        ],
      },
      {
        name: 'Dividends',
        data: [
          {
            x: now.minus({ months: 7 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 6 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 5 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 4 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 3 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
          {
            x: now.minus({ months: 2 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: 150,
          },
          {
            x: now.minus({ months: 1 }).startOf('month').plus({ days: 1 }).toMillis(),
            y: 50,
          },
          {
            x: now.startOf('month').plus({ days: 1 }).toMillis(),
            y: -0,
          },
        ],
      },
    ]);
  });
});
