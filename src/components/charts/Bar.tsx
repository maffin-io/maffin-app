import React from 'react';
import {
  Chart as C,
  ChartOptions,
  BarElement,
} from 'chart.js';
import ChartJS from '@/components/charts/ChartJS';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  BarElement,
);

export const OPTIONS: ChartOptions<'bar'> = {};

export default function Bar({
  options,
  ...props
}: Omit<ChartProps<'bar'>, 'type'>): JSX.Element {
  return (
    <ChartJS<'bar'>
      {...props}
      type="bar"
      options={{
        ...OPTIONS,
        ...options,
      }}
    />
  );
}
