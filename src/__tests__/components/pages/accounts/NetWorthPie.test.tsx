import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import Money from '@/book/Money';
import Chart, { ChartProps } from '@/components/charts/Chart';
import { NetWorthPie } from '@/components/pages/accounts';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('NetWorthPie', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as SWRResponse);
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with no data when no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as SWRResponse);
    render(<NetWorthPie />);

    expect(Chart).toBeCalledWith(
      {
        series: [0, -0],
        type: 'donut',
        unit: '',
        height: 300,
        options: {
          colors: ['#06B6D4', '#F97316'],
          dataLabels: {
            enabled: true,
            formatter: expect.any(Function),
          },
          grid: {
            padding: {
              bottom: -110,
            },
          },
          labels: ['Assets', 'Liabilities'],
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  total: {
                    formatter: expect.any(Function),
                    label: 'Net worth',
                    show: true,
                    showAlways: true,
                  },
                },
              },
              endAngle: 90,
              offsetY: 10,
              startAngle: -90,
            },
          },
          legend: {
            show: false,
          },
          states: {
            hover: {
              filter: {
                type: 'none',
              },
            },
          },
          tooltip: {
            enabled: false,
          },
        },
      },
      {},
    );
  });

  it('computes net worth as expected', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(500, 'EUR'),
          },
          // To check we don't add equity to the calculations as
          // equity transactions go to assets
          equity: {
            '11/2022': new Money(-200, 'EUR'),
          },
          liability: {
            '01/2023': new Money(-50, 'EUR'),
            '02/2023': new Money(-50, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(<NetWorthPie />);

    const props = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(props.series).toEqual([1000, 100]);
    expect(props.unit).toEqual('EUR');
    expect(
      props.options?.plotOptions?.pie?.donut?.labels?.total?.formatter?.(
        {
          globals: {
            series: [1000, 100],
          },
        },
      ),
    ).toEqual('€900.00');
    expect(
      props.options?.dataLabels?.formatter?.(
        0,
        {
          w: {
            globals: {
              series: [1000, 100],
              labels: ['Name'],
            },
          },
          seriesIndex: 0,
        },
      ),
    ).toEqual(['Name', '€1,000.00']);
  });

  it('computes net worth when no liabilities', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(500, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(<NetWorthPie />);

    const props = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(props.series).toEqual([1000, -0]);
    expect(props.unit).toEqual('EUR');
    expect(
      props.options?.plotOptions?.pie?.donut?.labels?.total?.formatter?.(
        {
          globals: {
            series: [1000, -0],
          },
        },
      ),
    ).toEqual('€1,000.00');
  });

  it('filters by selected date', () => {
    jest.spyOn(apiHook, 'useAccountsMonthlyTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(500, 'EUR'),
          },
          liability: {
            '01/2023': new Money(-50, 'EUR'),
            '02/2023': new Money(-50, 'EUR'),
          },
        },
      } as SWRResponse,
    );

    render(
      <NetWorthPie
        selectedDate={DateTime.fromISO('2023-01-01')}
      />,
    );

    const props = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(props.series).toEqual([500, 50]);
  });
});
