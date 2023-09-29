import React from 'react';
import { render } from '@testing-library/react';
import { Chart } from 'react-chartjs-2';

import ChartJS from '@/components/charts/ChartJS';

jest.mock('react-chartjs-2', () => ({
  ...jest.requireActual('react-chartjs-2'),
  Chart: jest.fn(
    () => <div data-testid="Chart" />,
  ),
}));

describe('ChartJS', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates chart with default parameters', () => {
    render(
      <ChartJS
        data={{ datasets: [] }}
        options={{}}
        type="doughnut"
      />,
    );

    expect(Chart).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {
          animation: false,
          responsive: true,
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
        },
        type: 'doughnut',
      },
      {},
    );
  });

  it('merges options', () => {
    render(
      <ChartJS
        data={{ datasets: [] }}
        options={{
          elements: {
            arc: {
              borderWidth: 0,
            },
          },
        }}
        type="doughnut"
      />,
    );

    expect(Chart).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {
          animation: false,
          responsive: true,
          font: {
            family: 'Intervariable',
            size: 14,
            weight: '300',
          },
          elements: {
            arc: {
              borderWidth: 0,
            },
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
        },
        type: 'doughnut',
      },
      {},
    );
  });
});
