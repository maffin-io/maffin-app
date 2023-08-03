import React from 'react';
import { render } from '@testing-library/react';

import { Account } from '@/book/entities';
import Money from '@/book/Money';
import Chart, { ChartProps } from '@/components/charts/Chart';
import NetWorthRadial from '@/components/pages/accounts/NetWorthRadial';
import type { AccountsTree } from '@/types/accounts';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));

describe('NetWorthRadial', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with no data when no accounts', () => {
    render(<NetWorthRadial tree={{} as AccountsTree} />);

    expect(Chart).toBeCalledWith(
      {
        colors: ['#06B6D4', '#F97316'],
        dataLabels: {
          enabled: true,
          dropShadow: {
            enabled: false,
          },
          formatter: expect.any(Function),
          style: {
            colors: ['#DDDDDD'],
          },
        },
        grid: {
          padding: {
            bottom: -110,
          },
        },
        height: 300,
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
        series: [],
        showLegend: false,
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
        type: 'donut',
        unit: '',
      },
      {},
    );
  });

  it('computes net worth as expected', () => {
    render(
      <NetWorthRadial
        tree={
          {
            account: { guid: 'root' } as Account,
            total: new Money(0, 'EUR'),
            children: [
              {
                account: { guid: 'assets', type: 'ASSET', commodity: { mnemonic: 'EUR' } },
                total: new Money(1000, 'EUR'),
                children: [],
              },
              {
                account: { guid: 'liabilities', type: 'LIABILITY' },
                total: new Money(100, 'EUR'),
                children: [],
              },
            ],
          }
        }
      />,
    );

    const options = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(options.series).toEqual([1000, 100]);
    expect(options.unit).toEqual('EUR');
    expect(options?.plotOptions?.pie?.donut?.labels?.total?.formatter?.(0)).toEqual('€900.00');
    expect(
      options?.dataLabels?.formatter?.(
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
      <NetWorthRadial
        tree={
          {
            account: { guid: 'root' } as Account,
            total: new Money(0, 'EUR'),
            children: [
              {
                account: { guid: 'assets', type: 'ASSET', commodity: { mnemonic: 'EUR' } },
                total: new Money(1000, 'EUR'),
                children: [],
              },
            ],
          }
        }
      />,
    );

    const options = (Chart as jest.Mock).mock.calls[0][0] as ChartProps;
    expect(options.series).toEqual([1000, 0]);
    expect(options.unit).toEqual('EUR');
    expect(options?.plotOptions?.pie?.donut?.labels?.total?.formatter?.(0)).toEqual('€1,000.00');
  });
});
