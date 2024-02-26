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
import { useAccountsMonthlyWorth, useMainCurrency } from '@/hooks/api';
import monthlyDates from '@/helpers/monthlyDates';

// We are using Bar chart here but one of the axis uses Line so
// we have to register here or otherwise we get an error.
// It's a bit hacky but this way we still have tree-shaking.
C.register(
  LineElement,
  LineController,
);

export type NetWorthHistogramProps = {
  selectedDate?: DateTime,
};

export default function NetWorthHistogram({
  selectedDate = DateTime.now(),
}: NetWorthHistogramProps): JSX.Element {
  const interval = Interval.fromDateTimes(
    selectedDate.minus({ months: 6 }).startOf('month'),
    selectedDate,
  );

  const { data: monthlyWorth } = useAccountsMonthlyWorth(interval);
  const assetSeries = monthlyWorth?.map(m => m.type_asset.toNumber());
  const liabilitySeries = monthlyWorth?.map(m => m.type_liability.toNumber());

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const datasets: ChartDataset<'bar'>[] = [
    {
      label: 'Assets',
      data: assetSeries || [],
      backgroundColor: '#06B6D4',
      order: 1,
      barPercentage: 0.6,
    },
  ];

  if (liabilitySeries) {
    datasets.push({
      label: 'Liabilities',
      data: liabilitySeries || [],
      backgroundColor: '#FF6600',
      order: 2,
      barPercentage: 0.6,
    });
    datasets.push({
      label: 'Net worth',
      // @ts-ignore
      type: 'line',
      data: assetSeries?.map((n, i) => n + (liabilitySeries?.[i] || 0)) || [],
      backgroundColor: '#0E7490',
      borderColor: '#0E7490',
      showLine: true,
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
        backgroundColor: '#0E7490FF',
        borderRadius: 5,
        color: '#FFF',
      },
    });
  }

  return (
    <>
      <Bar
        height="400"
        data={{
          labels: monthlyDates(interval),
          datasets,
        }}
        options={{
          layout: {
            padding: {
              right: 15,
            },
          },
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
          },
          scales: {
            x: {
              stacked: true,
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
              grace: 1,
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
