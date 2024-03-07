import React from 'react';
import {
  Chart as C,
  ChartOptions,
  Title,
  Tooltip,
  Legend,
  ChartTypeRegistry,
  CategoryScale,
  TimeScale,
  LinearScale,
  Colors,
  PointElement,
  LineElement,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import autocolors from 'chartjs-plugin-autocolors';
import type { ChartProps } from 'react-chartjs-2';

C.register(
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  Colors,
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  // Fixes issue of dynamic datasets becoming black
  autocolors,
);

C.defaults.color = '#94a3b8';
C.defaults.scale.grid.color = '#777f8522';

export default function ChartJS<T extends keyof ChartTypeRegistry>({
  options,
  ...props
}: ChartProps<T>): JSX.Element {
  // @ts-ignore
  const OPTIONS: ChartOptions<T> = {
    responsive: true,
    animation: false,
    font: {
      family: 'Intervariable',
      size: 14,
      weight: '300',
    },
    plugins: {
      title: {
        display: false,
      },
      datalabels: {
        display: false,
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <Chart
      {...props}
      options={{
        ...OPTIONS,
        ...options,
        plugins: {
          // @ts-ignore
          ...OPTIONS.plugins,
          // @ts-ignore
          ...options.plugins,
        },
      }}
    />
  );
}
