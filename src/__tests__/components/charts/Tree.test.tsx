import React from 'react';
import { render } from '@testing-library/react';

import ChartJS from '@/components/charts/ChartJS';
import Tree from '@/components/charts/Tree';

jest.mock('@/components/charts/ChartJS', () => jest.fn(
  () => <div data-testid="ChartJS" />,
));

describe('Tree', () => {
  // afterEach(() => {
  //   jest.clearAllMocks();
  // });

  it('creates chartJS with default parameters', () => {
    render(
      <Tree
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
        type: 'treemap',
      },
      {},
    );
  });

  it('merges options', () => {
    render(
      <Tree
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
        type: 'treemap',
      },
      {},
    );
  });
});
