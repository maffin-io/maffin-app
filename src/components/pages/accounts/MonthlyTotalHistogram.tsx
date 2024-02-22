import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import type { Account } from '@/book/entities';
import { useAccountsMonthlyTotal, useMainCurrency } from '@/hooks/api';
import { moneyToString } from '@/helpers/number';
import monthlyDates from '@/helpers/monthlyDates';

export type MonthlyTotalHistogramProps = {
  title: string,
  selectedDate?: DateTime,
  accounts: Account[],
};

export default function MonthlyTotalHistogram({
  title,
  selectedDate = DateTime.now(),
  accounts = [],
}: MonthlyTotalHistogramProps): JSX.Element {
  const interval = Interval.fromDateTimes(
    selectedDate.minus({ months: 6 }).startOf('month'),
    selectedDate,
  );
  const { data: monthlyTotals } = useAccountsMonthlyTotal(interval);

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const dates = monthlyDates(interval);
  const datasets: ChartDataset<'bar'>[] = [];

  if (accounts.length && monthlyTotals) {
    accounts.forEach(account => {
      const data = dates.map((_, i) => (
        monthlyTotals[i][account.guid]?.toNumber() || 0
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
      height="400"
      data={{
        labels: dates,
        datasets,
      }}
      options={{
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
