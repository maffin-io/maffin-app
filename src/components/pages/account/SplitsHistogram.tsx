import React from 'react';
import { Interval, DateTime } from 'luxon';
import type { ChartDataset } from 'chart.js';
import { moneyToString } from '@/helpers/number';

import Bar from '@/components/charts/Bar';
import * as API from '@/hooks/api';
import type { Account } from '@/book/entities';

export type SplitsHistogramProps = {
  account: Account,
};

export default function SplitsHistogram({
  account,
}: SplitsHistogramProps): JSX.Element {
  let { data: splits } = API.useSplits(account.guid);
  splits = splits || [];

  let datasets: ChartDataset<'bar'>[] = [];

  if (splits.length) {
    const interval = Interval.fromDateTimes(
      splits[splits.length - 1].transaction.date.startOf('year'),
      DateTime.now().endOf('year'),
    );
    const years = interval.splitBy({ year: 1 }).map(d => (d.start as DateTime).year);

    datasets = years.map((year, i) => ({
      label: year.toString(),
      hidden: i !== years.length - 1,
      data: new Array(12).fill(0),
    }));

    splits.forEach(split => {
      const { month, year } = split.transaction.date;
      let { quantity } = split;
      if (account.type === 'INCOME') {
        quantity = -quantity;
      }

      const yearSeries = datasets[years.indexOf(year)];
      yearSeries.data[month - 1] = yearSeries.data[month - 1] as number + quantity;
    });
  }

  return (
    <Bar
      data={{
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets,
      }}
      options={{
        plugins: {
          title: {
            display: true,
            text: 'Monthly movements',
            align: 'start',
            padding: {
              bottom: 30,
            },
            font: {
              size: 16,
            },
          },
          datalabels: {
            display: false,
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
            },
          },
          tooltip: {
            backgroundColor: '#323b44',
            callbacks: {
              label: (ctx) => `${moneyToString(Number(ctx.parsed.y), account.commodity.mnemonic)}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            border: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10,
              callback: (value) => moneyToString(value as number, account.commodity.mnemonic),
            },
          },
        },
      }}
    />
  );
}
