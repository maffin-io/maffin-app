import React from 'react';
import { Interval, DateTime } from 'luxon';

import Chart from '@/components/charts/Chart';
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

  const hiddenSeries: string[] = [];
  let series: {
    name: string,
    data: {
      x: string,
      y: number,
    }[],
  }[] = [];

  if (splits.length) {
    const interval = Interval.fromDateTimes(
      splits[splits.length - 1].transaction.date.startOf('year'),
      DateTime.now().endOf('year'),
    );
    const years = interval.splitBy({ year: 1 }).map(d => (d.start as DateTime).year);

    series = years.map(year => {
      hiddenSeries.push(year.toString());
      const yearInterval = Interval.fromDateTimes(
        DateTime.utc(year).startOf('year'),
        DateTime.utc(year).endOf('year'),
      );
      return {
        name: year.toString(),
        data: yearInterval.splitBy({ month: 1 }).map(d => ({
          x: (d.start as DateTime).toFormat('MMM'),
          y: 0,
        })),
      };
    });
    hiddenSeries.pop();

    splits.forEach(split => {
      const { month, year } = split.transaction.date;
      let { quantity } = split;
      if (account.type === 'INCOME') {
        quantity = -quantity;
      }

      const yearSeries = series[years.indexOf(year)];
      yearSeries.data[month - 1].y += quantity;
    });
  }

  return (
    <Chart
      type="bar"
      series={series}
      unit={account.commodity.mnemonic}
      options={{
        title: {
          text: 'Movements per month',
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '70%',
          },
        },
        chart: {
          events: {
            mounted: (chart) => hiddenSeries.forEach(name => {
              try {
                chart.hideSeries(name);
              } catch {
                // this fails sometimes for some reason but still renders
                // as expected. Adding the catch to protect against that.
              }
            }),
          },
        },
      }}
    />
  );
}
