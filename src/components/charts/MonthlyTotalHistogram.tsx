import React from 'react';
import { Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';

import Bar from '@/components/charts/Bar';
import type { Account } from '@/book/entities';
import { useAccounts, useAccountsMonthlyTotal, useMainCurrency } from '@/hooks/api';
import { moneyToString } from '@/helpers/number';
import monthlyDates from '@/helpers/monthlyDates';

export type MonthlyTotalHistogramProps = {
  title?: string,
  interval: Interval,
  guids: string[],
};

export default function MonthlyTotalHistogram({
  interval,
  title,
  guids = [],
}: MonthlyTotalHistogramProps): JSX.Element {
  const { data: monthlyTotals } = useAccountsMonthlyTotal(interval);
  const { data: accounts } = useAccounts();

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const datasets: ChartDataset<'bar'>[] = [];
  if (accounts && monthlyTotals) {
    guids.forEach(guid => {
      const data = monthlyTotals?.map(m => (m[guid]?.toNumber() || 0));
      if (!data.every(v => v === 0)) {
        datasets.push({
          label: (accounts.find(a => a.guid === guid) as Account).name,
          data,
        });
      }
    });
  }

  return (
    <Bar
      height="400"
      data={{
        labels: monthlyDates(interval),
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
            display: !!title,
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
