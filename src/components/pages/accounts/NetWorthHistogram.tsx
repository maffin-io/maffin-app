import React from 'react';
import { DateTime, Interval } from 'luxon';
import type { ChartDataset } from 'chart.js';
import {
  Chart as C,
  LineElement,
  LineController,
} from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import * as API from '@/hooks/api';

// We are using Bar chart here but one of the axis uses Line so
// we have to register here or otherwise we get an error.
// It's a bit hacky but this way we still have tree-shaking.
C.register(
  LineElement,
  LineController,
);

export type NetWorthHistogramProps = {
  startDate?: DateTime,
  selectedDate?: DateTime,
};

export default function NetWorthHistogram({
  startDate,
  selectedDate = DateTime.now().minus({ months: 3 }),
}: NetWorthHistogramProps): JSX.Element {
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();
  const assetSeries = monthlyTotals?.asset;
  const liabilitiesSeries = monthlyTotals?.liability;

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  const now = DateTime.now();
  const interval = Interval.fromDateTimes(
    startDate?.minus({ month: 1 }) || now,
    now,
  );
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).plus({ month: 1 }).startOf('month'));
  dates.pop();

  const datasets: ChartDataset<'bar'>[] = [
    {
      label: 'Assets',
      data: [],
      backgroundColor: '#06B6D4',
      order: 1,
      barPercentage: 0.6,
    },
  ];

  if (liabilitiesSeries) {
    datasets.push({
      label: 'Liabilities',
      data: [],
      backgroundColor: '#FF6600',
      order: 2,
      barPercentage: 0.6,
    });
    datasets.push({
      label: 'Net worth',
      // @ts-ignore
      type: 'line',
      data: [],
      backgroundColor: '#0E7490',
      borderColor: '#0E7490',
      showLine: false,
      pointStyle: 'rectRounded',
      pointRadius: 5,
      pointHoverRadius: 10,
      order: 0,
      datalabels: {
        display: (ctx) => {
          if (ctx.dataIndex % 2) {
            return true;
          }

          return false;
        },
        formatter: (value) => moneyToString(value, unit),
        align: 'end',
        backgroundColor: '#0E749066',
        borderRadius: 5,
        color: '#FFF',
      },
    });
  }

  dates.forEach(date => {
    const monthYear = (date as DateTime).toFormat('MM/yyyy');
    const assetTotal = (
      datasets[0].data[datasets[0].data.length - 1] as number || 0
    ) + (assetSeries?.[monthYear]?.toNumber() || 0);
    datasets[0].data.push(assetTotal);

    if (liabilitiesSeries) {
      const liabilityTotal = (
        datasets[1].data[datasets[1].data.length - 1] as number || 0
      ) + (liabilitiesSeries?.[monthYear]?.toNumber() || 0);
      datasets[1].data.push(liabilityTotal);
      datasets[2].data.push(assetTotal + liabilityTotal);
    }
  });

  if (now.diff(selectedDate, ['months']).months < 4) {
    selectedDate = now.minus({ months: 4 });
  }
  const zoomInterval = Interval.fromDateTimes(
    selectedDate.minus({ months: 4 }).startOf('month'),
    selectedDate.plus({ months: 4 }).startOf('month'),
  );

  return (
    <>
      <Bar
        height="400"
        data={{
          labels: dates,
          datasets,
        }}
        options={{
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
          },
          scales: {
            x: {
              stacked: true,
              min: zoomInterval.start?.toMillis(),
              max: zoomInterval.end?.toMillis(),
              type: 'time',
              time: {
                unit: 'month',
                tooltipFormat: 'MMMM yyyy',
                displayFormats: {
                  month: 'MMM-yy',
                },
              },
              grid: {
                display: false,
              },
              ticks: {
                align: 'center',
              },
            },
            y: {
              position: 'left',
              border: {
                display: false,
              },
              ticks: {
                maxTicksLimit: 10,
                callback: (value) => moneyToString(value as number, unit),
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Net Worth',
              align: 'start',
              padding: {
                top: 0,
                bottom: 30,
              },
              font: {
                size: 18,
              },
            },
            legend: {
              position: 'bottom',
              onClick: () => {},
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxHeight: 8,
                boxWidth: 8,
              },
            },
            tooltip: {
              backgroundColor: '#323b44',
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${moneyToString(Number(ctx.raw), unit)}`,
                labelColor: (ctx) => ({
                  borderColor: '#323b44',
                  backgroundColor: ctx.dataset.backgroundColor as string,
                  borderWidth: 3,
                  borderRadius: 2,
                }),
              },
            },
          },
        }}
      />
      <span />
    </>
  );
}
