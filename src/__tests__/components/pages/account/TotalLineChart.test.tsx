import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import type { Account, Split } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import TotalLineChart from '@/components/pages/account/TotalLineChart';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TotalLineChart', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with expected params', () => {
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

    expect(Chart).toBeCalledWith(
      {
        height: 255,
        series: [{ data: [] }],
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
      } as SWRResponse,
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
      } as SWRResponse,
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
