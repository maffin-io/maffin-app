import React from 'react';
import {
  Chart as C,
  ChartOptions,
} from 'chart.js';
import ChartJS from '@/components/charts/ChartJS';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  SankeyController,
  Flow,
);

export const OPTIONS: ChartOptions<'sankey'> = {
  font: {
    family: 'sans-serif',
    size: 12,
    weight: 400,
  },
};

export default function Bar({
  options,
  ...props
}: Omit<ChartProps<'sankey'>, 'type'>): React.JSX.Element {
  return (
    <ChartJS<'sankey'>
      {...props}
      type="sankey"
      options={{
        ...OPTIONS,
        ...options,
      }}
    />
  );
}
