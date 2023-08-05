import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';

import type { Split } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import TotalLineChart from '@/components/pages/account/TotalLineChart';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('TotalLineChart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with expected params', () => {
    render(<TotalLineChart splits={[]} />);

    expect(Chart).toBeCalledWith(
      {
        height: 255,
        series: [{ data: [] }],
        type: 'line',
        unit: undefined,
        options: {
          chart: {
            zoom: {
              enabled: false,
            },
          },
          xaxis: {
            type: 'datetime',
          },
        },
      },
      {},
    );
  });

  it('builds series accumulating values', () => {
    // note that splits are received ordered already. Without order, it will compute
    // wrongly
    render(
      <TotalLineChart
        splits={[
          {
            account: {
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2023-01-02'),
            },
            quantity: 100,
          } as Split,
          {
            account: {
              // This is not very accurate as type is always the same but
              // this way we test INCOME behavior in this same test
              type: 'INCOME',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            quantity: -200,
          } as Split,
        ]}
      />,
    );

    expect(Chart).toBeCalledWith(
      {
        height: 255,
        series: [
          {
            data: [
              {
                x: 1672531200000,
                y: 200,
              },
              {
                x: 1672617600000,
                y: 300,
              },
            ],
          },
        ],
        type: 'line',
        unit: 'EUR',
        options: {
          chart: {
            zoom: {
              enabled: false,
            },
          },
          xaxis: {
            type: 'datetime',
          },
        },
      },
      {},
    );
  });
});
