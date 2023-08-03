import React from 'react';
import { ApexOptions } from 'apexcharts';

import Chart from '@/components/charts/Chart';
import { Split } from '@/book/entities';

export type TotalLineChartProps = {
  splits: Split[],
};

export default function TotalLineChart({
  splits,
}: TotalLineChartProps): JSX.Element {
  const series: ApexOptions['series'] = [{ data: [] }];

  let totalAggregate = 0;
  splits.slice().reverse().forEach(split => {
    let { quantity } = split;
    if (split.account.type === 'INCOME') {
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
      unit={splits[0]?.account.commodity.mnemonic}
      height={255}
      xAxisType="datetime"
    />
  );
}
