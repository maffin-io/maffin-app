import React from 'react';
import { render } from '@testing-library/react';

import ChartJS from '@/components/charts/ChartJS';
import Sankey from '@/components/charts/Sankey';

jest.mock('@/components/charts/ChartJS', () => jest.fn(
  () => <div data-testid="ChartJS" />,
));

describe('Sankey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates chartJS with default parameters', () => {
    render(
      <Sankey
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
          font: {
            family: 'sans-serif',
            size: 12,
            weight: 400,
          },
        },
        type: 'sankey',
      },
      undefined,
    );
  });
});
