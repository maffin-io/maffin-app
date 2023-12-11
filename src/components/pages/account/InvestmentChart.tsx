import React from 'react';
import useSWRImmutable from 'swr/immutable';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';

import { Price } from '@/book/entities';
import Line from '@/components/charts/Line';
import { moneyToString } from '@/helpers/number';
import type { Account } from '@/book/entities';
import { useInvestments } from '@/hooks/api';
import Loading from '@/components/Loading';

Chart.register(annotationPlugin);

export type InvestmentChartProps = {
  account: Account,
};

export default function InvestmentChart({
  account,
}: InvestmentChartProps): JSX.Element {
  const { data: investments } = useInvestments(account.guid);
  let { data: prices } = useSWRImmutable(
    `/api/prices/${account.guid}`,
    async () => Price.findBy({
      fk_commodity: {
        guid: account.commodity.guid,
      },
    }),
  );

  const investment = investments?.[0];
  if (!investment) {
    return <Loading />;
  }

  let numStocks = 0;
  const numStocksData: { x: number, y: number }[] = [];
  const annotations: AnnotationOptions[] = [];
  investment.account.splits.forEach(split => {
    numStocks += split.quantity;
    numStocksData.push({
      x: split.transaction.date.toMillis(),
      y: numStocks,
    });
    annotations.push({
      type: 'label',
      xValue: split.transaction.date.toMillis(),
      yValue: numStocks,
      content: 'Buy',
    });
  });

  prices = prices || [];
  const currency = (prices.length && prices[0].currency.mnemonic) || '';

  const pricesData: { x: number, y: number }[] = [];
  prices.forEach(price => {
    pricesData.push({
      x: price.date.toMillis(),
      y: price.value,
    });
  });

  return (
    <Line
      height="400px"
      data={{
        datasets: [
          {
            data: pricesData,
            pointStyle: 'circle',
          },
          {
            data: numStocksData,
            // @ts-ignore
            type: 'bar',
            pointStyle: 'cross',
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
              label: (ctx) => `${moneyToString(Number(ctx.parsed.y), currency)}`,
            },
          },
          annotation: {
            annotations,
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
