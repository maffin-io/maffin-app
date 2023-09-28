import React from 'react';
import {
  Chart as C,
  ChartOptions,
  ArcElement,
  DoughnutController,
} from 'chart.js';
import ChartJS from '@/components/charts/ChartJS';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  ArcElement,
  DoughnutController,
);

export const OPTIONS: ChartOptions<'doughnut'> = {
  elements: {
    arc: {
      borderWidth: 0,
    },
  },
};

export default function Doughnut({
  options,
  ...props
}: Omit<ChartProps<'doughnut'>, 'type'>): JSX.Element {
  return (
    <ChartJS<'doughnut'>
      {...props}
      type="doughnut"
      options={{
        ...OPTIONS,
        ...options,
      }}
    />
  );
}
