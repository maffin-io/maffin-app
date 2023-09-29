import React from 'react';
import {
  Chart as C,
  ChartOptions,
  LineElement,
  LineController,
  PointElement,
} from 'chart.js';
import ChartJS from '@/components/charts/ChartJS';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  LineElement,
  PointElement,
  LineController,
);

export const OPTIONS: ChartOptions<'line'> = {};

export default function Line({
  options,
  ...props
}: Omit<ChartProps<'line'>, 'type'>): JSX.Element {
  return (
    <ChartJS<'line'>
      {...props}
      type="line"
      options={{
        ...OPTIONS,
        ...options,
      }}
    />
  );
}
