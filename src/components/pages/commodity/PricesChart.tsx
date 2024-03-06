import React from 'react';

import Line from '@/components/charts/Line';
import { moneyToString } from '@/helpers/number';
import { Price } from '@/book/entities';

export type PricesChartProps = {
  prices: Price[],
};

export default function PricesChart({
  prices,
}: PricesChartProps): JSX.Element {
  const currency = (prices.length && prices[0].currency.mnemonic) || '';

  const data: { x: number, y: number }[] = [];
  prices.forEach(price => {
    data.push({
      x: price.date.toMillis(),
      y: price.value,
    });
  });

  return (
    <Line
      data={{
        datasets: [
          {
            data,
            pointStyle: 'circle',
          },
        ],
      }}
      options={{
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
              label: (ctx) => `${moneyToString(Number(ctx.parsed.y), currency)}`,
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              tooltipFormat: 'dd MMMM yyyy',
              displayFormats: {
                month: 'MMM-yy',
              },
            },
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
              callback: (value) => moneyToString(value as number, currency),
            },
          },
        },
      }}
    />
  );
}
