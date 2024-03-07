import React from 'react';
import { render } from '@testing-library/react';

import ChartJS from '@/components/charts/ChartJS';
import Pie from '@/components/charts/Pie';

jest.mock('@/components/charts/ChartJS', () => jest.fn(
  () => <div data-testid="ChartJS" />,
));

describe('Pie', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates chartJS with default parameters', () => {
    render(
      <Pie
        data={{ datasets: [] }}
        options={{}}
      />,
    );

    expect(ChartJS).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {
          elements: {
            arc: {
              borderWidth: 0,
            },
          },
          plugins: {
            autocolors: {
              mode: 'data',
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
      <Pie
        data={{ datasets: [] }}
        options={{
          plugins: {
            title: {
              display: true,
            },
          },
        }}
      />,
    );

    expect(ChartJS).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {
          elements: {
            arc: {
              borderWidth: 0,
            },
          },
          plugins: {
            title: {
              display: true,
            },
            autocolors: {
              mode: 'data',
            },
          },
        },
        type: 'doughnut',
      },
      {},
    );
  });
});
