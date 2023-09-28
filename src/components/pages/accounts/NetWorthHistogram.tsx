import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import * as API from '@/hooks/api';

export type NetWorthHistogramProps = {
  startDate?: DateTime,
  selectedDate?: DateTime,
};

export default function NetWorthHistogram({
  startDate,
  selectedDate = DateTime.now().minus({ months: 3 }),
}: NetWorthHistogramProps): JSX.Element {
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();
  const incomeSeries = { ...monthlyTotals?.income };
  Object.entries(monthlyTotals?.equity || {}).forEach(([date, total]) => {
    if (date in incomeSeries) {
      incomeSeries[date] = incomeSeries[date].add(total);
    } else {
      incomeSeries[date] = total;
    }
  });
  const expenseSeries = monthlyTotals?.expense;

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  const now = DateTime.now();
  const interval = Interval.fromDateTimes(
    startDate?.minus({ month: 1 }) || now,
    now,
  );
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }).startOf('month'));
  dates.pop();

  const datasets: ChartDataset<'bar'>[] = [
    {
      label: 'Net worth',
      // @ts-ignore
      type: 'line',
      data: [],
      backgroundColor: '#06B6D4',
      borderColor: '#06B6D4',
      yAxisID: 'y1',
      showLine: false,
      pointStyle: 'rectRounded',
      pointRadius: 5,
      pointHoverRadius: 10,
    },
    {
      label: 'Income',
      data: [],
      backgroundColor: '#22C55E',
    },
    {
      label: 'Expenses',
      data: [],
      backgroundColor: '#EF4444',
    },
    {
      label: 'Net profit',
      data: [],
      backgroundColor: '#06B6D4',
    },
  ];

  dates.forEach(date => {
    const monthYear = (date as DateTime).toFormat('MM/yyyy');
    const incomeAmount = (incomeSeries?.[monthYear]?.toNumber() || 0);
    const expenseAmount = (expenseSeries?.[monthYear]?.toNumber() || 0);
    const netProfit = -incomeAmount - expenseAmount;
    const previousNetWorth = datasets[0].data[datasets[0].data.length - 1] || 0;

    datasets[1].data.push(-incomeAmount);
    datasets[2].data.push(-expenseAmount);
    datasets[3].data.push(netProfit);
    datasets[0].data.push(previousNetWorth as number + netProfit);
  });

  if (now.diff(selectedDate, ['months']).months < 4) {
    selectedDate = now.minus({ months: 4 });
  }
  const zoomInterval = Interval.fromDateTimes(
    selectedDate.minus({ months: 4 }).startOf('month'),
    selectedDate.plus({ months: 4 }).startOf('month'),
  );

  return (
    <>
      <Bar
        data={{
          labels: dates,
          datasets,
        }}
        options={{
          interaction: {
            mode: 'index',
          },
          scales: {
            x: {
              min: zoomInterval.start?.toMillis(),
              max: zoomInterval.end?.toMillis(),
              type: 'time',
              time: {
                unit: 'month',
                tooltipFormat: 'MMMM yyyy',
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
              title: {
                display: true,
                text: 'Monthly net profit',
              },
              position: 'left',
              border: {
                display: false,
              },
              ticks: {
                maxTicksLimit: 10,
                callback: (value) => moneyToString(value as number, unit),
              },
            },
            y1: {
              title: {
                display: true,
                text: 'Accumulated net worth',
              },
              type: 'linear',
              display: true,
              position: 'right',
              border: {
                display: false,
              },
              grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
                display: false,
              },
              ticks: {
                maxTicksLimit: 10,
                callback: (value) => moneyToString(value as number, unit),
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxHeight: 8,
                boxWidth: 8,
              },
            },
            tooltip: {
              backgroundColor: '#323b44',
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${moneyToString(Number(ctx.raw), unit)}`,
                labelColor: (ctx) => ({
                  borderColor: '#323b44',
                  backgroundColor: ctx.dataset.backgroundColor as string,
                  borderWidth: 3,
                  borderRadius: 2,
                }),
              },
            },
          },
        }}
      />
      <span />
    </>
  );
}
