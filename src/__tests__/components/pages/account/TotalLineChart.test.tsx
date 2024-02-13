import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import type { Account, Split } from '@/book/entities';
import Line from '@/components/charts/Line';
import TotalLineChart from '@/components/pages/account/TotalLineChart';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Line', () => jest.fn(
  () => <div data-testid="Line" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TotalLineChart', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as UseQueryResult<Split[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Line with no data', () => {
    render(
      <TotalLineChart
        account={
          {
            guid: 'guid',
            commodity: {
              mnemonic: 'EUR',
            },
          } as Account
        }
      />,
    );

    expect(Line).toBeCalledWith(
      {
        height: '255px',
        data: {
          datasets: [
            {
              data: [],
              pointStyle: false,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
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
              title: {
                display: true,
                text: 'Equity over time',
              },
            },
          },
        },
      },
      {},
    );
  });

  it('builds series accumulating values', () => {
    // note that splits are received ordered already. Without order, it will compute
    // wrongly
    jest.spyOn(apiHook, 'useSplits').mockReturnValue(
      {
        data: [
          {
            transaction: {
              date: DateTime.fromISO('2023-01-02'),
            },
            quantity: 100,
          } as Split,
          {
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            quantity: 200,
          } as Split,
        ],
      } as UseQueryResult<Split[]>,
    );

    render(
      <TotalLineChart
        account={
          {
            guid: 'guid',
            commodity: {
              mnemonic: 'EUR',
            },
          } as Account
        }
      />,
    );

    expect(Line).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
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
              pointStyle: false,
            },
          ],
        },
      }),
      {},
    );
  });

  it('builds series accumulating values with INCOME', () => {
    // note that splits are received ordered already. Without order, it will compute
    // wrongly
    jest.spyOn(apiHook, 'useSplits').mockReturnValue(
      {
        data: [
          {
            transaction: {
              date: DateTime.fromISO('2023-01-02'),
            },
            quantity: -100,
          } as Split,
          {
            transaction: {
              date: DateTime.fromISO('2023-01-01'),
            },
            quantity: -200,
          } as Split,
        ],
      } as UseQueryResult<Split[]>,
    );

    render(
      <TotalLineChart
        account={
          {
            guid: 'guid',
            type: 'INCOME',
            commodity: {
              mnemonic: 'EUR',
            },
          } as Account
        }
      />,
    );

    expect(Line).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
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
              pointStyle: false,
            },
          ],
        },
      }),
      {},
    );
  });
});
