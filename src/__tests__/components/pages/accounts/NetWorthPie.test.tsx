import React from 'react';
import { render } from '@testing-library/react';

import { Account } from '@/book/entities';
import Money from '@/book/Money';
import Chart, { ChartProps } from '@/components/charts/Chart';
import NetWorthPie from '@/components/pages/accounts/NetWorthPie';
import type { AccountsTree } from '@/types/accounts';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('NetWorthPie', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with no data when no accounts', () => {
    render(<NetWorthPie tree={{} as AccountsTree} />);

    expect(Chart).toBeCalledWith(
      {
        series: [],
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
    render(
      <NetWorthPie
        tree={
          {
            account: { guid: 'root' } as Account,
            total: new Money(0, 'EUR'),
            monthlyTotals: {},
            children: [
              {
                account: { guid: 'assets', type: 'ASSET', commodity: { mnemonic: 'EUR' } },
                total: new Money(1000, 'EUR'),
                monthlyTotals: {},
                children: [],
              },
              {
                account: { guid: 'liabilities', type: 'LIABILITY' },
                total: new Money(100, 'EUR'),
                monthlyTotals: {},
                children: [],
              },
            ],
          }
        }
      />,
    );

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
    render(
      <NetWorthPie
        tree={
          {
            account: { guid: 'root' } as Account,
            total: new Money(0, 'EUR'),
            monthlyTotals: {},
            children: [
              {
                account: { guid: 'assets', type: 'ASSET', commodity: { mnemonic: 'EUR' } },
                total: new Money(1000, 'EUR'),
                monthlyTotals: {},
                children: [],
              },
            ],
          }
        }
      />,
    );

    const props = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(props.series).toEqual([1000, 0]);
    expect(props.unit).toEqual('EUR');
    expect(
      props.options?.plotOptions?.pie?.donut?.labels?.total?.formatter?.(
        {
          globals: {
            series: [1000, 0],
          },
        },
      ),
    ).toEqual('€1,000.00');
  });
});
