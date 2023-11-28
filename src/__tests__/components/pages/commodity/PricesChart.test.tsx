import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';

import type { Price } from '@/book/entities';
import Line from '@/components/charts/Line';
import PricesChart from '@/components/pages/commodity/PricesChart';

jest.mock('@/components/charts/Line', () => jest.fn(
  () => <div data-testid="Line" />,
));

describe('TotalLineChart', () => {
  it('creates Line with expected params', () => {
    render(
      <PricesChart
        prices={[
          {
            guid: 'guid',
            date: DateTime.fromISO('2023-01-01'),
            value: 100,
            currency: {
              mnemonic: 'EUR',
            },
          } as Price,
        ]}
      />,
    );

    expect(Line).toBeCalledWith(
      {
        data: {
          datasets: [
            {
              data: [
                {
                  x: 1672531200000,
                  y: 100,
                },
              ],
              pointStyle: 'circle',
            },
          ],
        },
        options: {
          plugins: {
            datalabels: {
              display: false,
            },
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: '#323b44',
              callbacks: {
                label: expect.any(Function),
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              time: {
                round: 'day',
                unit: 'day',
                tooltipFormat: 'dd MMMM yyyy',
              },
              type: 'time',
            },
            y: {
              border: {
                display: false,
              },
              ticks: {
                callback: expect.any(Function),
                maxTicksLimit: 10,
              },
            },
          },
        },
      },
      {},
    );
  });
});
