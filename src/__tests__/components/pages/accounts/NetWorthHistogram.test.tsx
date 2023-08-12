import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import { Account } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import { NetWorthHistogram } from '@/components/pages/accounts';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('NetWorthHistogram', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-02'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('renders with empty tree', () => {
    render(
      <NetWorthHistogram
        tree={{
          account: { childrenIds: [] },
          leaves: [],
        }}
        monthlyTotals={{}}
      />,
    );

    expect(Chart).toBeCalledTimes(2);
    expect(Chart).toHaveBeenNthCalledWith(
      1,
      {
        height: 350,
        type: 'line',
        series: [
          {
            data: [],
            type: 'column',
            name: 'Income',
          },
          {
            data: [],
            type: 'column',
            name: 'Expenses',
          },
          {
            data: [],
            type: 'column',
            name: 'Net profit',
          },
          {
            data: [],
            type: 'line',
            name: 'Net worth',
          },
        ],
        options: {
          chart: {
            id: 'netWorthHistogram',
          },
          xaxis: {
            type: 'datetime',
            crosshairs: {
              show: true,
              width: 'barWidth',
              opacity: 0.1,
              stroke: {
                width: 0,
              },
            },
          },
          colors: ['#22C55E', '#EF4444', '#06B6D4', '#06B6D4'],
          plotOptions: {
            bar: {
              columnWidth: '70%',
            },
          },
          markers: {
            size: 2,
            strokeColors: '#06B6D4',
          },
          legend: {
            position: 'top',
            onItemClick: {
              toggleDataSeries: false,
            },
          },
          yaxis: [
            {
              seriesName: 'Income',
              title: {
                text: 'Net profit',
              },
              labels: {
                formatter: expect.any(Function),
              },
              forceNiceScale: true,
            },
            {
              seriesName: 'Income',
              show: false,
              labels: {
                formatter: expect.any(Function),
              },
            },
            {
              seriesName: 'Income',
              show: false,
              labels: {
                formatter: expect.any(Function),
              },
            },
            {
              opposite: true,
              seriesName: 'Net worth',
              title: {
                text: 'Net worth',
              },
              forceNiceScale: true,
              labels: {
                formatter: expect.any(Function),
              },
            },
          ],
        },
      },
      {},
    );

    expect(Chart).toHaveBeenNthCalledWith(
      2,
      {
        height: 100,
        type: 'line',
        series: [
          {
            data: [],
            name: 'Net worth',
            type: 'line',
          },
        ],
        options: {
          chart: {
            brush: {
              enabled: true,
              target: 'netWorthHistogram',
            },
            selection: {
              enabled: true,
              xaxis: {
                min: DateTime.now().minus({ months: 6 }).toMillis(),
                max: DateTime.now().toMillis(),
              },
              fill: {
                color: '#888',
                opacity: 0.4,
              },
              stroke: {
                color: '#0D47A1',
              },
            },
          },
          colors: ['#06B6D4'],
          grid: {
            show: false,
          },
          xaxis: {
            type: 'datetime',
          },
          yaxis: {
            show: false,
          },
        },
      },
      {},
    );
  });

  it('generates series from tree as expected', () => {
    render(
      <NetWorthHistogram
        startDate={DateTime.fromISO('2022-09-01')}
        monthlyTotals={{
          income: {
            '11/2022': new Money(-600, 'EUR'),
            '12/2022': new Money(-400, 'EUR'),
          },
          expenses: {
            '11/2022': new Money(400, 'EUR'),
            '12/2022': new Money(500, 'EUR'),
          },
        }}
        tree={
          {
            account: { guid: 'root' } as Account,
            leaves: [
              {
                account: { guid: 'income', type: 'INCOME', commodity: { mnemonic: 'EUR' } },
                leaves: [],
              },
              {
                account: { guid: 'expenses', type: 'EXPENSE' },
                leaves: [],
              },
            ],
          }
        }
      />,
    );

    const mainSeries = (Chart as jest.Mock).mock.calls[0][0].series;
    expect(mainSeries).toEqual([
      {
        name: 'Income',
        type: 'column',
        data: [
          {
            x: DateTime.fromISO('2022-10-01'),
            y: -0,
          },
          {
            x: DateTime.fromISO('2022-11-01'),
            y: 600,
          },
          {
            x: DateTime.fromISO('2022-12-01'),
            y: 400,
          },
          {
            x: DateTime.fromISO('2023-01-01'),
            y: -0,
          },
        ],
      },
      {
        name: 'Expenses',
        type: 'column',
        data: [
          {
            x: DateTime.fromISO('2022-10-01'),
            y: -0,
          },
          {
            x: DateTime.fromISO('2022-11-01'),
            y: -400,
          },
          {
            x: DateTime.fromISO('2022-12-01'),
            y: -500,
          },
          {
            x: DateTime.fromISO('2023-01-01'),
            y: -0,
          },
        ],
      },
      {
        name: 'Net profit',
        type: 'column',
        data: [
          {
            x: DateTime.fromISO('2022-10-01'),
            y: -0,
          },
          {
            x: DateTime.fromISO('2022-11-01'),
            y: 200,
          },
          {
            x: DateTime.fromISO('2022-12-01'),
            y: -100,
          },
          {
            x: DateTime.fromISO('2023-01-01'),
            y: -0,
          },
        ],
      },
      {
        name: 'Net worth',
        type: 'line',
        data: [
          {
            x: DateTime.fromISO('2022-10-01'),
            y: 0,
          },
          {
            x: DateTime.fromISO('2022-11-01'),
            y: 200,
          },
          {
            x: DateTime.fromISO('2022-12-01'),
            y: 100,
          },
          {
            x: DateTime.fromISO('2023-01-01'),
            y: 100,
          },
        ],
      },
    ]);

    const brushSeries = (Chart as jest.Mock).mock.calls[1][0].series;
    expect(brushSeries).toEqual([
      {
        name: 'Net worth',
        type: 'line',
        data: [
          {
            x: DateTime.fromISO('2022-10-01'),
            y: 0,
          },
          {
            x: DateTime.fromISO('2022-11-01'),
            y: 200,
          },
          {
            x: DateTime.fromISO('2022-12-01'),
            y: 100,
          },
          {
            x: DateTime.fromISO('2023-01-01'),
            y: 100,
          },
        ],
      },
    ]);
  });

  it('selects brush X range with selected date', () => {
    const selectedDate = DateTime.fromISO('2022-01-01');
    render(
      <NetWorthHistogram
        selectedDate={selectedDate}
        tree={{
          account: { childrenIds: [] },
          leaves: [],
        }}
        monthlyTotals={{}}
      />,
    );

    expect((Chart as jest.Mock).mock.calls[1][0].options.chart.selection.xaxis).toEqual({
      min: selectedDate.minus({ months: 3 }).toMillis(),
      max: selectedDate.plus({ months: 3 }).toMillis(),
    });
  });
});
