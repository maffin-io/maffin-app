import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import { useAccountsMonthlyTotal, useMainCurrency } from '@/hooks/api';

export type IncomeExpenseHistogramProps = {
  selectedDate?: DateTime,
};

export default function IncomeExpenseHistogram({
  selectedDate = DateTime.now(),
}: IncomeExpenseHistogramProps): JSX.Element {
  const interval = Interval.fromDateTimes(
    selectedDate.minus({ months: 6 }).startOf('month'),
    selectedDate,
  );
  const { data: monthlyTotals } = useAccountsMonthlyTotal(interval);
  const incomeSeries = monthlyTotals?.income;
  const expenseSeries = monthlyTotals?.expense;

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).startOf('month'));
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
        backgroundColor: '#06B6D4FF',
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

    datasets[0].data.push(-incomeAmount || 0);
    datasets[1].data.push(-expenseAmount || 0);
    datasets[2].data.push(netProfit || 0);
  });

  return (
    <>
      <Bar
        height="400"
        data={{
          labels: dates,
          datasets,
        }}
        options={{
          layout: {
            padding: {
              right: 15,
            },
          },
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
          },
          scales: {
            x: {
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
              grace: 1,
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
