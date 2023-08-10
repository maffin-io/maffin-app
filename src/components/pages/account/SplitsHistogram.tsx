import React from 'react';
import { Interval, DateTime } from 'luxon';

import Chart from '@/components/charts/Chart';
import { Split } from '@/book/entities';

export type SplitsHistogramProps = {
  splits: Split[],
  accountType: string,
  currency: string,
};

export default function SplitsHistogram({
  splits,
  accountType,
  currency,
}: SplitsHistogramProps): JSX.Element {
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
      splits[splits.length - 1].transaction.date,
      splits[0]?.transaction.date,
    );
    const years = interval.splitBy({ year: 1 }).map(d => (d.start as DateTime).year);
    const currentYear = DateTime.now().year;
    if (!years.includes(currentYear)) {
      years.push(DateTime.now().year);
    }

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
      if (accountType === 'INCOME') {
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
      unit={currency}
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
