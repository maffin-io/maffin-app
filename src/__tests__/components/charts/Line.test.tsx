import React from 'react';
import { render } from '@testing-library/react';

import ChartJS from '@/components/charts/ChartJS';
import Line from '@/components/charts/Line';

jest.mock('@/components/charts/ChartJS', () => jest.fn(
  () => <div data-testid="ChartJS" />,
));

describe('Line', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates chartJS with default parameters', () => {
    render(
      <Line
        data={{ datasets: [] }}
        options={{}}
      />,
    );

    expect(ChartJS).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {},
        type: 'line',
      },
      undefined,
    );
  });

  it('merges options', () => {
    render(
      <Line
        data={{ datasets: [] }}
        options={{
          plugins: undefined,
        }}
      />,
    );

    expect(ChartJS).toHaveBeenCalledWith(
      {
        data: {
          datasets: [],
        },
        options: {
          plugins: undefined,
        },
        type: 'line',
      },
      undefined,
    );
  });
});
