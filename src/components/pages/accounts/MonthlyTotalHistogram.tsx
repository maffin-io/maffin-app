import React from 'react';
import { DateTime, Interval } from 'luxon';

import Chart from '@/components/charts/Chart';
import * as API from '@/hooks/api';
import { Account } from '@/book/entities';

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
    selectedDate.minus({ months: 4 }),
    selectedDate.plus({ months: 4 }),
  );

  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }).endOf('month'));

  const series: {
    name: string,
    data: { x: number, y: number }[],
  }[] = [];

  if (accounts.length && monthlyTotals) {
    accounts.forEach(account => {
      series.push({
        name: account.name,
        data: dates.map(date => ({
          y: account.type === 'INCOME'
            ? (monthlyTotals[account.guid]?.[date.toFormat('MM/yyyy')]?.toNumber() || 0) * -1
            : monthlyTotals[account.guid]?.[date.toFormat('MM/yyyy')]?.toNumber() || 0,
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
      unit={unit}
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
