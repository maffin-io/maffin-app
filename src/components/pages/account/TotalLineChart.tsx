import React from 'react';
import { ApexOptions } from 'apexcharts';

import Chart from '@/components/charts/Chart';
import { Split } from '@/book/entities';

export type TotalLineChartProps = {
  splits: Split[],
  accountType: string,
  currency: string,
};

export default function TotalLineChart({
  splits,
  accountType,
  currency,
}: TotalLineChartProps): JSX.Element {
  const series: ApexOptions['series'] = [{ data: [] }];

  let totalAggregate = 0;
  splits.slice().reverse().forEach(split => {
    let { quantity } = split;
    if (accountType === 'INCOME') {
      quantity = -quantity;
    }
    totalAggregate += quantity;

    (series[0].data as { x: number, y: number }[]).push({
      x: split.transaction.date.toMillis(),
      y: totalAggregate,
    });
  });

  return (
    <Chart
      type="line"
      series={series}
      unit={currency}
      height={255}
      options={{
        chart: {
          zoom: {
            enabled: false,
          },
        },
        xaxis: {
          type: 'datetime',
        },
      }}
    />
  );
}
