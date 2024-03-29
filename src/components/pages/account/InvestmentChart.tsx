import React from 'react';
import { Chart, Filler } from 'chart.js';
import { DateTime } from 'luxon';

import { Price } from '@/book/entities';
import Line from '@/components/charts/Line';
import { moneyToString } from '@/helpers/number';
import type { Account } from '@/book/entities';
import { useInvestment, usePrices } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import Loading from '@/components/Loading';
import { intervalToDates } from '@/helpers/dates';

Chart.register(Filler);

export type InvestmentChartProps = {
  account: Account,
};

export default function InvestmentChart({
  account,
}: InvestmentChartProps): JSX.Element {
  const { data: investment } = useInvestment(account.guid);
  const { data: pricesMap } = usePrices({ from: account.commodity });
  const { data: interval } = useInterval();

  if (!investment || !pricesMap) {
    return <Loading />;
  }

  if (!investment.splits.length) {
    return (
      <div className="flex h-full text-sm place-content-center place-items-center">
        <span>You don&apos;t have any transactions for this investment yet!</span>
      </div>
    );
  }

  const prices = pricesMap.prices || [];
  const currency = (prices.length && prices[0].currency.mnemonic) || '';

  const pricesData: { x: number, y: number }[] = [];
  prices.forEach(price => {
    pricesData.push({
      x: price.date.toMillis(),
      y: price.value,
    });
  });

  const numStocksData: { x: number, y: number }[] = [];
  const valueData: { x: number, y: number }[] = [];
  const dates = intervalToDates(interval);

  dates.forEach(x => {
    investment.processSplits(x);
    numStocksData.push({
      x: x.startOf('month').toMillis(),
      y: investment.quantity.toNumber(),
    });

    const price = findClosestPrice(x, prices || []);
    if (price) {
      valueData.push({
        x: x.toMillis(),
        y: investment.quantity.toNumber() * price.value,
      });
    }
  });

  return (
    <Line
      data={{
        labels: dates.map(d => d.startOf('month')),
        datasets: [
          {
            label: 'Num. stocks',
            data: numStocksData,
            yAxisID: 'yStocks',
            // @ts-ignore
            type: 'bar',
            borderColor: 'rgba(124, 58, 237, 1)',
            backgroundColor: 'rgba(124, 58, 237, 1)',
            order: 0,
          },
          {
            label: 'Price',
            data: pricesData,
            yAxisID: 'yPrice',
            pointStyle: 'circle',
            tension: 0.4,
            cubicInterpolationMode: 'monotone',
            fill: false,
            borderColor: 'rgba(234, 88, 12, 1)',
            backgroundColor: 'rgba(234, 88, 12, 1)',
            order: 1,
          },
          {
            label: 'Value',
            data: valueData,
            yAxisID: 'yValue',
            fill: false,
            pointRadius: 5,
            borderColor: 'rgba(22, 163, 74)',
            backgroundColor: 'rgba(22, 163, 74)',
            order: 2,
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
            display: true,
            onClick: () => {},
            labels: {
              pointStyle: 'circle',
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#323b44',
            callbacks: {
              title: (tooltipItems) => {
                if (tooltipItems[0].datasetIndex === 0) {
                  return dates[tooltipItems[0].dataIndex].toFormat('DD');
                }

                return undefined;
              },
              label: (item) => {
                if (item.datasetIndex === 0) {
                  return `${moneyToString(Number(item.parsed.y), investment.account.commodity.mnemonic)}`;
                }

                return `${moneyToString(Number(item.parsed.y), currency)}`;
              },
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
              offset: false,
            },
            border: {
              display: false,
            },
            min: interval.start?.toISODate(),
            max: interval.end?.toISODate(),
          },
          yStocks: {
            offset: true,
            beginAtZero: true,
            stackWeight: 2,
            stack: 'investment',
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: 'rgba(124, 58, 237, 1)',
              callback: (value) => moneyToString(
                value as number,
                investment.account.commodity.mnemonic,
              ),
            },
          },
          yPrice: {
            offset: true,
            stackWeight: 4,
            stack: 'investment',
            border: {
              display: false,
            },
            ticks: {
              color: 'rgba(234, 88, 12, 0.7)',
              maxTicksLimit: 10,
              callback: (value) => moneyToString(value as number, currency),
            },
          },
          yValue: {
            offset: true,
            stackWeight: 4,
            stack: 'investment',
            border: {
              display: false,
            },
            ticks: {
              color: 'rgba(22, 163, 74)',
              maxTicksLimit: 10,
              callback: (value) => moneyToString(value as number, currency),
            },
          },
        },
      }}
    />
  );
}

function findClosestPrice(date: DateTime, prices: Price[]): Price {
  const possible = prices.filter(price => price.date <= date);
  return possible[possible.length - 1];
}
