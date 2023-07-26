'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

import { toFixed } from '@/helpers/number';

export type ChartProps = {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'treemap',
  series?: ApexOptions['series'],
  labels?: string[],
  id?: string,
  title?: string,
  showLegend?: boolean,
  xCategories?: string[],
  unit?: string,
  stacked?: boolean,
  height?: number,
  xAxisType?: 'datetime' | 'category' | 'numeric' | undefined,
  yFormatter?: (val: number, opts?: any) => string,
  events?: {
    mounted?(chart: any, options?: any): void
    dataPointSelection?(e: any, chart?: any, options?: any): void
  },
  dataLabels?: ApexOptions['dataLabels'],
  plotOptions?: ApexOptions['plotOptions'],
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
  title,
  id,
  yFormatter,
  series = [],
  labels = [],
  showLegend = true,
  stacked = false,
  xCategories = [],
  unit = '',
  height = 400,
  xAxisType = undefined,
  dataLabels = {
    enabled: false,
  },
  plotOptions = {},
  events = {},
}: ChartProps): JSX.Element {
  if (!series?.length) {
    return (
      <span>Loading...</span>
    );
  }

  if (!yFormatter) {
    yFormatter = (val: number) => `${toFixed(val)}${unit}`;
  }

  let options = OPTIONS;
  options = {
    ...options,
    labels,
    chart: {
      ...options.chart,
      id,
      sparkline: {
        enabled: type === 'treemap',
      },
      stacked,
      events,
    },
    dataLabels,
    plotOptions,
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
        formatter: (type !== 'treemap' && !plotOptions.bar?.horizontal) ? yFormatter : undefined,
      },
    },
    tooltip: {
      ...options.tooltip,
      y: {
        formatter: yFormatter,
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
  states: {
    active: {
      allowMultipleDataPointsSelection: false,
      filter: {
        type: 'lighten',
        value: 0.5,
      },
    },
  },
};
