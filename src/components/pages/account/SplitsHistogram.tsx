import React from 'react';
import { ApexOptions } from 'apexcharts';

import Chart from '@/components/charts/Chart';
import { Split } from '@/book/entities';
import { currencyToSymbol } from '@/book/helpers';

const MONTHS: { [key:number]:string; } = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

export type SplitsHistogramProps = {
  splits: Split[],
};

export default function SplitsHistogram({
  splits,
}: SplitsHistogramProps): JSX.Element {
  const yearlyAggregate: { [year: string]: { [month: string]: number } } = {};

  splits.forEach(split => {
    const { year, month } = split.transaction.date;
    const yearData = yearlyAggregate[year] || {};
    let { quantity } = split;
    if (split.account.type === 'INCOME') {
      quantity = -quantity;
    }
    yearData[month] = (yearData[month] || 0) + quantity;
    yearlyAggregate[year] = yearData;
  });

  const series: ApexOptions['series'] = [];
  const hiddenSeries: string[] = [];

  Object.keys(yearlyAggregate).forEach((year, index) => {
    Object.keys(MONTHS).forEach(month => {
      if (!series[index]) {
        series[index] = {
          name: year,
          data: [],
        };
      }

      // @ts-ignore not sure why data type is wrong here...
      series[index].data.push({
        x: `${MONTHS[Number(month)]}`,
        y: yearlyAggregate[year][month] || 0,
      });
    });

    hiddenSeries.push(year);
  });

  hiddenSeries.pop();

  return (
    <Chart
      type="bar"
      series={series}
      title="Movements per month"
      xCategories={Object.values(MONTHS)}
      unit={currencyToSymbol(splits[0]?.account.commodity.mnemonic || '')}
      plotOptions={
        {
          bar: {
            horizontal: false,
            columnWidth: '55%',
          },
        }
      }
      events={
        {
          mounted: (chart) => hiddenSeries.forEach(name => {
            try {
              chart.hideSeries(name);
            } catch {
              // this fails sometimes for some reason but still renders
              // as expected. Adding the catch to protect against that.
            }
          }),
        }
      }
    />
  );
}
