'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

import { toFixed } from '@/helpers/number';

export type ChartProps = {
  type: 'line' | 'bar' | 'pie' | 'donut',
  series?: ApexOptions['series'],
  labels?: string[],
  title?: string,
  showLegend?: boolean,
  xCategories?: string[],
  hideSeries?: string[],
  unit?: string,
  height?: number,
  xAxisType?: 'datetime' | 'category' | 'numeric' | undefined,
};

// apexcharts import references window so we need this
// https://stackoverflow.com/questions/68596778
// However, I haven't found a neat way to fix types that's why
// we need the ts-ignore in the return.
const ApexChart = dynamic(
  () => import('react-apexcharts').then((module) => module.default),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  },
);

export default function Chart({
  type,
  title = '',
  series = [],
  labels = [],
  showLegend = true,
  xCategories = [],
  hideSeries = [],
  unit = '',
  height = 400,
  xAxisType = undefined,
}: ChartProps): JSX.Element {
  if (!series?.length) {
    return (
      <span>Loading...</span>
    );
  }

  let options = OPTIONS;
  options = {
    ...options,
    labels,
    chart: {
      ...options.chart,
      id: title,
      events: {
        mounted: (chart) => hideSeries.forEach(name => {
          try {
            chart.hideSeries(name);
          } catch {
            // this fails sometimes for some reason but still renders
            // as expected. Adding the catch to protect against that.
          }
        }),
      },
    },
    legend: {
      show: showLegend,
    },
    title: {
      text: title,
      align: 'left',
    },
    xaxis: {
      ...options.xaxis,
      categories: xCategories,
      type: xAxisType,
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${toFixed(val)} ${unit}`,
      },
    },
    tooltip: {
      ...options.tooltip,
      y: {
        formatter: (val: number) => `${toFixed(val)} ${unit}`,
      },
    },
    stroke: {
      ...options.stroke,
      width: type === 'line' ? 1 : 0,
      dashArray: type === 'line' ? 5 : 0,
    },
  };

  return (
    // @ts-ignore
    <ApexChart
      options={options}
      series={series}
      type={type}
      className="apex-charts"
      // https://stackoverflow.com/questions/75103994
      width="100%"
      height={height}
    />
  );
}

const OPTIONS: ApexOptions = {
  grid: {
    borderColor: '#777f85',
  },
  chart: {
    id: 'line',
    width: '100%',
    foreColor: '#94A3B8',
    toolbar: {
      show: false,
    },
    zoom: {
      type: 'x',
      enabled: true,
      autoScaleYaxis: true,
    },
  },
  stroke: {
    dashArray: 5,
    curve: 'smooth',
  },
  xaxis: {
    axisBorder: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    fillSeriesColor: true,
    x: {
      show: false,
    },
    theme: 'dark',
    intersect: true,
    inverseOrder: true,
    shared: false,
  },
};
