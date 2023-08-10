import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';

import type { Split } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));
const ChartMock = Chart as jest.MockedFunction<typeof Chart>;

describe('SplitsHistogram', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with expected params', () => {
    render(
      <SplitsHistogram
        splits={[]}
        currency="EUR"
        accountType="EXPENSE"
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
    render(
      <SplitsHistogram
        currency="EUR"
        accountType="EXPENSE"
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
        ]}
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
    render(
      <SplitsHistogram
        currency="EUR"
        accountType="EXPENSE"
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
        ]}
      />,
    );

    const mountedEvent = ChartMock.mock.calls[0][0].options?.chart?.events?.mounted as Function;
    const mockHideSeries = jest.fn();
    mountedEvent({ hideSeries: mockHideSeries });
    expect(mockHideSeries).toBeCalledTimes(1);
    expect(mockHideSeries).toBeCalledWith('2022');
  });
});
