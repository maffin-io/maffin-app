import React from 'react';
import { Chart, ChartOptions, Filler } from 'chart.js';
import { DateTime } from 'luxon';
import type { ChartDataset } from 'chart.js';

import { Price } from '@/book/entities';
import Line from '@/components/charts/Line';
import { moneyToString } from '@/helpers/number';
import type { Account } from '@/book/entities';
import { useInvestment, usePrices } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import Loading from '@/components/Loading';
import { intervalToDates } from '@/helpers/dates';
import { InvestmentAccount } from '@/book/models';

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
  const isCurrencyInvestment = investment.account.commodity.namespace === 'CURRENCY';

  investment.splits
    .filter(s => interval.contains(s.transaction.date) && !InvestmentAccount.isDividend(s))
    .forEach(s => {
      investment.processSplits(s.transaction.date);
      numStocksData.push({
        x: s.transaction.date.toMillis(),
        y: !isCurrencyInvestment ? investment.quantity.toNumber() : investment.cost.toNumber(),
      });

      const price = pricesMap.getInvestmentPrice(
        investment.account.commodity.mnemonic,
        s.transaction.date,
      );

      if (price) {
        valueData.push({
          x: s.transaction.date.toMillis(),
          y: investment.quantity.toNumber() * price.value,
        });
      }
    });

  dates.forEach(x => {
    const alreadyExists = numStocksData.find(d => d.x === x.toMillis());

    if (!alreadyExists) {
      investment.processSplits(x);
      numStocksData.push({
        x: x.toMillis(),
        y: !isCurrencyInvestment ? investment.quantity.toNumber() : investment.cost.toNumber(),
      });

      const price = pricesMap.getInvestmentPrice(investment.account.commodity.mnemonic, x);
      if (price) {
        valueData.push({
          x: x.toMillis(),
          y: investment.quantity.toNumber() * price.value,
        });
      }
    }
  });

  const datasets: ChartDataset<'line'>[] = [
    {
      label: !isCurrencyInvestment ? 'Num. stocks' : 'Contributed',
      data: numStocksData.sort((a, b) => a.x - b.x),
      showLine: false,
      pointStyle: 'rectRot',
      pointRadius: 5,
      pointHoverRadius: 5,
      yAxisID: 'yStocks',
      borderColor: 'rgba(124, 58, 237, 1)',
      backgroundColor: 'rgba(124, 58, 237, 1)',
      order: 0,
    },
    {
      label: 'Value',
      data: valueData.sort((a, b) => a.x - b.x),
      yAxisID: 'yValue',
      fill: false,
      pointRadius: 5,
      pointHoverRadius: 5,
      borderColor: 'rgba(22, 163, 74)',
      backgroundColor: 'rgba(22, 163, 74)',
      order: 2,
    },
  ];

  const scales: ChartOptions<'line'>['scales'] = {
    x: {
      offset: true,
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
  };

  if (!isCurrencyInvestment) {
    datasets.push({
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
    });

    scales.yPrice = {
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
    };
  }

  return (
    <Line
      data={{
        labels: dates.map(d => d.startOf('month')),
        datasets,
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
              label: (item) => {
                if (item.datasetIndex === 1) {
                  return `${moneyToString(Number(item.parsed.y), investment.account.commodity.mnemonic)}`;
                }

                return `${moneyToString(Number(item.parsed.y), currency)}`;
              },
            },
          },
        },
        scales,
      }}
    />
  );
}
