import React from 'react';
import type { ChartDataset } from 'chart.js';
import {
  Chart as C,
  LineElement,
  LineController,
} from 'chart.js';

import Bar from '@/components/charts/Bar';
import { moneyToString } from '@/helpers/number';
import { useMonthlyWorth } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import { intervalToDates } from '@/helpers/dates';

// We are using Bar chart here but one of the axis uses Line so
// we have to register here or otherwise we get an error.
// It's a bit hacky but this way we still have tree-shaking.
C.register(
  LineElement,
  LineController,
);

export type NetWorthHistogramProps =
| {
  title?: string,
  assetsGuid: string,
  assetsConfig?: Partial<ChartDataset>,
  liabilitiesGuid?: never,
  liabilitiesConfig?: never,
  showLegend?: boolean,
  height?: number,
}
| {
  title?: string,
  assetsGuid?: never,
  assetsConfig?: never,
  liabilitiesGuid: string,
  liabilitiesConfig?: Partial<ChartDataset>,
  showLegend?: boolean,
  height?: number,
}
| {
  title?: string,
  assetsGuid: string,
  assetsConfig?: Partial<ChartDataset>,
  liabilitiesGuid: string,
  liabilitiesConfig?: Partial<ChartDataset>,
  showLegend?: boolean,
  height?: number,
};

export default function NetWorthHistogram({
  title = 'Net worth',
  assetsGuid = '',
  assetsConfig = {},
  liabilitiesGuid = '',
  liabilitiesConfig = {},
  showLegend = true,
  height = 400,
}: NetWorthHistogramProps): React.JSX.Element {
  const { data: interval } = useInterval();
  const { data: monthlyWorth } = useMonthlyWorth();
  const assetSeries = monthlyWorth?.map(m => m[assetsGuid]?.toNumber() || 0);
  const liabilitySeries = monthlyWorth?.map(m => m[liabilitiesGuid]?.toNumber() || 0);

  const unit = monthlyWorth?.[0][assetsGuid]?.currency || '';

  const datasets: ChartDataset<'bar'>[] = [];

  if (assetsGuid) {
    datasets.push({
      backgroundColor: '#06B6D4',
      order: 1,
      barPercentage: 0.6,
      ...assetsConfig,
      data: assetSeries || [],
    } as ChartDataset<'bar'>);
  }

  if (liabilitiesGuid) {
    datasets.push({
      backgroundColor: '#FF6600',
      order: 2,
      barPercentage: 0.6,
      ...liabilitiesConfig,
      data: liabilitySeries || [],
    } as ChartDataset<'bar'>);
  }

  if (assetsGuid && liabilitiesGuid) {
    datasets.push({
      label: 'Net worth',
      // @ts-ignore
      type: 'line',
      data: assetSeries?.map((n, i) => n + (liabilitySeries?.[i] || 0)) || [],
      backgroundColor: '#0E7490',
      borderColor: '#0E7490',
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

  const labels = intervalToDates(interval);
  return (
    <>
      <div>
        <Bar
          height={height}
          data={{
            labels: labels.map(d => d.startOf('month')),
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
                beginAtZero: false,
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
                text: title,
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
                display: showLegend,
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
                  title: (tooltipItem) => labels[tooltipItem[0].dataIndex].toFormat('DD'),
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
      </div>
      <span />
    </>
  );
}
