import React from 'react';
import {
  Chart as C,
  ChartOptions,
} from 'chart.js';
import ChartJS from '@/components/charts/ChartJS';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  TreemapElement,
  TreemapController,
);

export const OPTIONS: ChartOptions<'treemap'> = {};

export default function Tree({
  options,
  ...props
}: Omit<ChartProps<'treemap'>, 'type'>): React.JSX.Element {
  return (
    <ChartJS<'treemap'>
      {...props}
      type="treemap"
      options={{
        ...OPTIONS,
        ...options,
      }}
    />
  );
}
