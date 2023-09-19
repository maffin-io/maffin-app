import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import type { Account, Split } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));
const ChartMock = Chart as jest.MockedFunction<typeof Chart>;

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('SplitsHistogram', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with expected params', () => {
    render(
      <SplitsHistogram
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
        series: [],
        type: 'bar',
        unit: 'EUR',
        options: {
          title: {
            text: 'Movements per month',
          },
          chart: {
            events: {
              mounted: expect.any(Function),
            },
          },
          plotOptions: {
            bar: {
              columnWidth: '70%',
              horizontal: false,
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
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2022-01-01'),
            },
            quantity: -200,
          } as Split,
        ],
      } as SWRResponse,
    );

    render(
      <SplitsHistogram
        account={
          {
            guid: 'guid',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'EXPENSE',
          } as Account
        }
      />,
    );

    expect(Chart).toBeCalledWith(
      {
        series: [
          {
            data: [
              {
                x: 'Jan',
                y: -200,
              },
              {
                x: 'Feb',
                y: 0,
              },
              {
                x: 'Mar',
                y: 0,
              },
              {
                x: 'Apr',
                y: 0,
              },
              {
                x: 'May',
                y: 0,
              },
              {
                x: 'Jun',
                y: 0,
              },
              {
                x: 'Jul',
                y: 0,
              },
              {
                x: 'Aug',
                y: 0,
              },
              {
                x: 'Sep',
                y: 0,
              },
              {
                x: 'Oct',
                y: 0,
              },
              {
                x: 'Nov',
                y: 0,
              },
              {
                x: 'Dec',
                y: 0,
              },
            ],
            name: '2022',
          },
          {
            data: [
              {
                x: 'Jan',
                y: 100,
              },
              {
                x: 'Feb',
                y: 0,
              },
              {
                x: 'Mar',
                y: 0,
              },
              {
                x: 'Apr',
                y: 0,
              },
              {
                x: 'May',
                y: 0,
              },
              {
                x: 'Jun',
                y: 0,
              },
              {
                x: 'Jul',
                y: 0,
              },
              {
                x: 'Aug',
                y: 0,
              },
              {
                x: 'Sep',
                y: 0,
              },
              {
                x: 'Oct',
                y: 0,
              },
              {
                x: 'Nov',
                y: 0,
              },
              {
                x: 'Dec',
                y: 0,
              },
            ],
            name: '2023',
          },
        ],
        type: 'bar',
        unit: 'EUR',
        options: {
          title: {
            text: 'Movements per month',
          },
          chart: {
            events: {
              mounted: expect.any(Function),
            },
          },
          plotOptions: {
            bar: {
              columnWidth: '70%',
              horizontal: false,
            },
          },
        },
      },
      {},
    );
  });

  it('hides all series except last', () => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue(
      {
        data: [
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
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2022-01-01'),
            },
            quantity: -200,
          } as Split,
        ],
      } as SWRResponse,
    );

    render(
      <SplitsHistogram
        account={
          {
            guid: 'guid',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'EXPENSE',
          } as Account
        }
      />,
    );

    const mountedEvent = ChartMock.mock.calls[0][0].options?.chart?.events?.mounted as Function;
    const mockHideSeries = jest.fn();
    mountedEvent({ hideSeries: mockHideSeries });
    expect(mockHideSeries).toBeCalledTimes(1);
    expect(mockHideSeries).toBeCalledWith('2022');
  });

  it('works when splits are all in a single year', () => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue(
      {
        data: [
          {
            account: {
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2022-01-01'),
            },
            quantity: -200,
          } as Split,
        ],
      } as SWRResponse,
    );

    render(
      <SplitsHistogram
        account={
          {
            guid: 'guid',
            commodity: {
              mnemonic: 'EUR',
            },
            type: 'EXPENSE',
          } as Account
        }
      />,
    );
  });
});
