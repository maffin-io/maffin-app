import React from 'react';
import { ApexOptions } from 'apexcharts';

import Chart from '@/components/charts/Chart';
import * as API from '@/hooks/api';
import type { Account } from '@/book/entities';

export type TotalLineChartProps = {
  account: Account,
};

export default function TotalLineChart({
  account,
}: TotalLineChartProps): JSX.Element {
  let { data: splits } = API.useSplits(account.guid);
  splits = splits || [];

  const series: ApexOptions['series'] = [{ data: [] }];

  let totalAggregate = 0;
  splits.slice().reverse().forEach(split => {
    let { quantity } = split;
    if (account.type === 'INCOME') {
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
      unit={account.commodity.mnemonic}
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
