import React from 'react';
import { DateTime, Interval } from 'luxon';

import Chart from '@/components/charts/Chart';
import type { AccountsTree } from '@/types/book';
import { moneyToString } from '@/helpers/number';

export type NetWorthHistogramProps = {
  startDate?: DateTime,
  selectedDate?: DateTime,
  tree: AccountsTree,
};

export default function NetWorthHistogram({
  startDate,
  selectedDate = DateTime.now().minus({ months: 3 }),
  tree,
}: NetWorthHistogramProps): JSX.Element {
  const now = DateTime.now();
  if (now.diff(selectedDate, ['months']).months < 3) {
    selectedDate = now.minus({ months: 3 });
  }
  const brushInterval = Interval.fromDateTimes(
    selectedDate.minus({ months: 3 }),
    selectedDate.plus({ months: 3 }),
  );
  const interval = Interval.fromDateTimes(
    startDate || now,
    now,
  );
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }));
  dates.pop();

  // Seems apexcharts types are not correct so need to define manually
  const series: {
    name: string,
    type: string,
    data: {
      x: DateTime,
      y: number,
    }[],
  }[] = [
    {
      name: 'Income',
      type: 'column',
      data: [],
    },
    {
      name: 'Expenses',
      type: 'column',
      data: [],
    },
    {
      name: 'Net profit',
      type: 'column',
      data: [],
    },
    {
      name: 'Net worth',
      type: 'line',
      data: [],
    },
  ];

  let incomeAccount: AccountsTree | undefined;
  if ((tree?.children || []).length) {
    incomeAccount = tree.children.find(a => a.account.type === 'INCOME');
    const expensesAccount = tree.children.find(a => a.account.type === 'EXPENSE');
    dates.forEach(date => {
      const monthYear = (date as DateTime).toFormat('MMM/yy');
      const incomeAmount = (incomeAccount?.monthlyTotals[monthYear]?.toNumber() || 0);
      series[0].data.push({
        y: incomeAmount,
        x: date,
      });

      const expenseAmount = (expensesAccount?.monthlyTotals[monthYear]?.toNumber() || 0);
      series[1].data.push({
        y: -expenseAmount,
        x: date,
      });

      const netProfit = incomeAmount - expenseAmount;
      series[2].data.push({
        y: netProfit,
        x: date,
      });

      const previousNetWorth = series[3].data[series[3].data.length - 1]?.y || 0;
      series[3].data.push({
        y: previousNetWorth + netProfit,
        x: date,
      });
    });
  }

  return (
    <>
      <Chart
        type="line"
        series={series}
        height={350}
        options={{
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
                formatter: (val: number) => moneyToString(
                  val,
                  incomeAccount?.account.commodity.mnemonic,
                ),
              },
              forceNiceScale: true,
            },
            {
              seriesName: 'Income',
              show: false,
              labels: {
                formatter: (val: number) => moneyToString(
                  val,
                  incomeAccount?.account.commodity.mnemonic,
                ),
              },
            },
            {
              seriesName: 'Income',
              show: false,
              labels: {
                formatter: (val: number) => moneyToString(
                  val,
                  incomeAccount?.account.commodity.mnemonic,
                ),
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
                formatter: (val: number) => moneyToString(
                  val,
                  incomeAccount?.account.commodity.mnemonic,
                ),
              },
            },
          ],
        }}
      />

      <Chart
        height={100}
        type="line"
        series={[series[3]]}
        options={
          {
            chart: {
              brush: {
                enabled: true,
                target: 'netWorthHistogram',
              },
              selection: {
                enabled: true,
                xaxis: {
                  min: (brushInterval.start as DateTime).toMillis(),
                  max: (brushInterval.end as DateTime).toMillis(),
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
          }
        }
      />
    </>
  );
}
