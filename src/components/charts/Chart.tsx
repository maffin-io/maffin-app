'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

import { moneyToString } from '@/helpers/number';

export type ChartProps = {
  options?: ApexOptions,
  series?: ApexOptions['series'],
  type?: 'bar' | 'line' | 'pie' | 'donut' | 'treemap',
  height?: number,
  unit?: string,
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
  options = {},
  series = [],
  type = 'line',
  height = 400,
  unit = '',
}: ChartProps): JSX.Element {
  if (!series?.length) {
    return (
      <span>Loading...</span>
    );
  }

  OPTIONS.yaxis = {
    labels: {
      formatter: (val: number) => moneyToString(val, unit),
    },
  };
  OPTIONS.tooltip = {
    ...OPTIONS.tooltip,
    y: {
      formatter: (val: number) => moneyToString(val, unit),
    },
  };

  const mergedOptions: ApexOptions = {
    ...OPTIONS,
    ...options,
    chart: {
      ...OPTIONS.chart,
      ...options.chart,
    },
    tooltip: {
      ...OPTIONS.tooltip,
      ...options.tooltip,
    },
    dataLabels: {
      ...OPTIONS.dataLabels,
      ...options.dataLabels,
    },
    stroke: {
      ...OPTIONS.stroke,
      width: type === 'line' ? 1 : 0,
      ...options.stroke,
    },
    xaxis: {
      ...OPTIONS.xaxis,
      ...options.xaxis,
    },
  };

  return (
    // @ts-ignore
    <ApexChart
      options={mergedOptions}
      series={series}
      type={type}
      // https://stackoverflow.com/questions/75103994
      width="100%"
      height={height}
    />
  );
}

const OPTIONS: ApexOptions = {
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
  grid: {
    borderColor: '#777f85',
  },
  dataLabels: {
    enabled: false,
    style: {
      colors: ['#DDDDDD'],
      fontFamily: 'Intervariable',
      fontWeight: '300',
      fontSize: '14px',
    },
    dropShadow: {
      enabled: false,
    },
  },
  stroke: {
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
