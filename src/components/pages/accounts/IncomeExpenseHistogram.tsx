import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import * as API from '@/hooks/api';

export type IncomeExpenseHistogramProps = {
  startDate?: DateTime,
  selectedDate?: DateTime,
};

export default function IncomeExpenseHistogram({
  startDate,
  selectedDate = DateTime.now().minus({ months: 3 }),
}: IncomeExpenseHistogramProps): JSX.Element {
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();
  const incomeSeries = monthlyTotals?.income;
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
      label: 'Savings',
      data: [],
      backgroundColor: '#06B6D4',
      datalabels: {
        anchor: 'end',
        display: true,
        formatter: (value) => moneyToString(value, unit),
        align: 'end',
        backgroundColor: '#06B6D466',
        borderRadius: 5,
        color: '#FFF',
      },
    },
  ];

  dates.forEach(date => {
    const monthYear = (date as DateTime).toFormat('MM/yyyy');
    const incomeAmount = (incomeSeries?.[monthYear]?.toNumber() || 0);
    const expenseAmount = (expenseSeries?.[monthYear]?.toNumber() || 0);
    const netProfit = -incomeAmount - expenseAmount;

    datasets[0].data.push(-incomeAmount);
    datasets[1].data.push(-expenseAmount);
    datasets[2].data.push(netProfit);
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
        height="400"
        data={{
          labels: dates,
          datasets,
        }}
        options={{
          maintainAspectRatio: false,
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
              position: 'left',
              border: {
                display: false,
              },
              ticks: {
                maxTicksLimit: 10,
                callback: (value) => moneyToString(value as number, unit),
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Monthly Savings',
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
              onClick: () => {},
              position: 'bottom',
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
