import React from 'react';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import { useMonthlyTotals, useMainCurrency } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import { intervalToDates } from '@/helpers/dates';

export default function IncomeExpenseHistogram(): React.JSX.Element {
  const { data: interval } = useInterval();
  const { data: monthlyTotals } = useMonthlyTotals(interval);
  const incomeSeries = monthlyTotals?.map(m => m.type_income?.toNumber() || 0);
  const expenseSeries = monthlyTotals?.map(m => m.type_expense?.toNumber() || 0);

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const datasets: ChartDataset<'bar'>[] = [
    {
      label: 'Income',
      data: incomeSeries || [],
      backgroundColor: '#22C55E',
    },
    {
      label: 'Expenses',
      data: expenseSeries?.map(n => -n || 0) || [],
      backgroundColor: '#EF4444',
    },
    {
      label: 'Savings',
      data: incomeSeries?.map((n, i) => n - (expenseSeries?.[i] || 0)) || [],
      backgroundColor: '#06B6D4',
      datalabels: {
        anchor: 'end',
        display: (ctx) => {
          if (ctx.dataset.data.length < 8) {
            return true;
          }

          if (ctx.dataIndex % 2) {
            return true;
          }

          return false;
        },
        formatter: (value) => moneyToString(value, unit),
        align: 'end',
        backgroundColor: '#06B6D4FF',
        borderRadius: 5,
        color: '#FFF',
      },
    },
  ];

  return (
    <>
      <Bar
        height="400"
        data={{
          labels: intervalToDates(interval).map(d => d.startOf('month')),
          datasets,
        }}
        options={{
          layout: {
            padding: {
              right: 20,
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
