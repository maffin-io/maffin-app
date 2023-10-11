import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import type { Account } from '@/book/entities';
import * as API from '@/hooks/api';
import { moneyToString } from '@/helpers/number';

export type MonthlyTotalHistogramProps = {
  title: string,
  selectedDate?: DateTime,
  accounts: Account[],
};

export default function MonthlyTotalHistogram({
  title,
  selectedDate = DateTime.now().minus({ months: 4 }),
  accounts = [],
}: MonthlyTotalHistogramProps): JSX.Element {
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();
  const now = DateTime.now();

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  if (now.diff(selectedDate, ['months']).months < 4) {
    selectedDate = now.minus({ months: 4 });
  }
  const interval = Interval.fromDateTimes(
    selectedDate.minus({ months: 5 }),
    selectedDate.plus({ months: 4 }),
  );

  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }).startOf('month'));

  const datasets: ChartDataset<'bar'>[] = [];

  if (accounts.length && monthlyTotals) {
    accounts.forEach(account => {
      const data = dates.map(date => (
        account.type === 'INCOME'
          ? (monthlyTotals[account.guid]?.[date.toFormat('MM/yyyy')]?.toNumber() || 0) * -1
          : monthlyTotals[account.guid]?.[date.toFormat('MM/yyyy')]?.toNumber() || 0
      ));
      if (!data.every(v => v === 0)) {
        datasets.push({
          label: account.name,
          data,
        });
      }
    });
  }

  return (
    <Bar
      data={{
        labels: dates,
        datasets,
      }}
      options={{
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
              callback: (value) => moneyToString(value as number, unit),
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: title,
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
            backgroundColor: (tooltipItem) => tooltipItem.tooltip.labelColors[0].backgroundColor,
            callbacks: {
              title: () => '',
              label: (ctx) => `${ctx.dataset.label}: ${moneyToString(Number(ctx.raw), unit)}`,
            },
          },
        },
      }}
    />
  );
}
