import React from 'react';
import { DateTime, Interval } from 'luxon';

import Chart from '@/components/charts/Chart';
import type { AccountsTree } from '@/types/accounts';

export type MonthlyTotalHistogramProps = {
  title: string,
  selectedDate?: DateTime,
  tree?: AccountsTree,
};

export default function MonthlyTotalHistogram({
  title,
  selectedDate = DateTime.now().minus({ months: 4 }),
  tree,
}: MonthlyTotalHistogramProps): JSX.Element {
  const now = DateTime.now();

  if (now.diff(selectedDate, ['months']).months < 4) {
    selectedDate = now.minus({ months: 4 });
  }
  const interval = Interval.fromDateTimes(
    selectedDate.minus({ months: 4 }),
    selectedDate.plus({ months: 4 }),
  );

  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }).endOf('month'));

  const series: {
    name: string,
    data: { x: number, y: number }[],
  }[] = [];

  if (tree) {
    tree.children.forEach(leaf => {
      series.push({
        name: leaf.account.name,
        data: dates.map(date => ({
          y: leaf.monthlyTotals[date.toFormat('MMM/yy')]?.toNumber() || 0,
          x: date.startOf('month').plus({ days: 1 }).toMillis(),
        })),
      });
    });
  }

  return (
    <Chart
      type="bar"
      series={series.filter(serie => !serie.data.every(n => n.y === 0))}
      height={300}
      unit={tree?.account.commodity.mnemonic}
      options={{
        chart: {
          stacked: true,
        },
        colors: [
          '#2E93fA',
          '#66DA26',
          '#546E7A',
          '#E91E63',
          '#FF9800',
          '#9C27B0',
          '#00BCD4',
          '#4CAF50',
          '#FF5722',
          '#FFC107',
        ],
        title: {
          text: title,
        },
        xaxis: {
          type: 'datetime',
        },
        plotOptions: {
          bar: {
            columnWidth: '60%',
          },
        },
      }}
    />
  );
}
