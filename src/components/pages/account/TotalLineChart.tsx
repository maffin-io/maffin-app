import React from 'react';

import Line from '@/components/charts/Line';
import * as API from '@/hooks/api';
import { moneyToString } from '@/helpers/number';
import type { Account } from '@/book/entities';

export type TotalLineChartProps = {
  account: Account,
};

export default function TotalLineChart({
  account,
}: TotalLineChartProps): JSX.Element {
  let { data: splits } = API.useSplits({ guid: account.guid });
  splits = splits || [];

  let totalAggregate = 0;
  const data: { x: number, y: number }[] = [];
  splits.slice().reverse().forEach(split => {
    let { quantity } = split;
    if (account.type === 'INCOME') {
      quantity = -quantity;
    }
    totalAggregate += quantity;

    data.push({
      x: split.transaction.date.toMillis(),
      y: totalAggregate,
    });
  });

  return (
    <Line
      height="255px"
      data={{
        datasets: [
          {
            data,
            pointStyle: false,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false,
          },
          legend: {
            display: false,
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
            type: 'time',
            time: {
              unit: 'day',
              round: 'day',
              tooltipFormat: 'dd MMMM yyyy',
            },
            grid: {
              display: false,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Equity over time',
            },
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
