import React from 'react';
import { render } from '@testing-library/react';

import ChartJS from '@/components/charts/ChartJS';
import Bar from '@/components/charts/Bar';

jest.mock('@/components/charts/ChartJS', () => jest.fn(
  () => <div data-testid="ChartJS" />,
));

describe('Bar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates chartJS with default parameters', () => {
    render(
      <Bar
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
        type: 'bar',
      },
      {},
    );
  });
});
