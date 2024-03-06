import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import Pie from '@/components/charts/Pie';
import { TotalsPie } from '@/components/charts';
import * as apiHook from '@/hooks/api';
import type { Account, Commodity } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';

jest.mock('@/components/charts/Pie', () => jest.fn(
  () => <div data-testid="Pie" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TotalsPie', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Pie with no data when no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    render(<TotalsPie title="" />);

    expect(Pie).toBeCalledWith(
      {
        data: {
          datasets: [
            {
              data: [],
            },
          ],
          labels: [],
        },
        options: {
          aspectRatio: 1.5,
          circumference: 180,
          cutout: '65%',
          layout: {
            padding: 40,
          },
          rotation: -90,
          plugins: {
            datalabels: {
              display: true,
              borderRadius: 2,
              color: '#DDDDDD',
              formatter: expect.any(Function),
              padding: 6,
              textAlign: 'center',
            },
            tooltip: {
              enabled: false,
              displayColors: false,
              callbacks: {
                label: expect.any(Function),
              },
            },
          },
        },
      },
      {},
    );
  });

  it('works with asset/liability', () => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-02-20') as DateTime<true>);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          { guid: 'type_asset', name: 'Assets' },
          { guid: 'type_liability', name: 'Liabilities' },
        ],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          type_asset: new Money(1500, 'EUR'),
          type_liability: new Money(-150, 'EUR'),
        } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>,
    );

    render(
      <TotalsPie
        title="Net worth"
        backgroundColor={['#111', '#222']}
        guids={['type_asset', 'type_liability']}
      />,
    );

    screen.getByText('€1,350.00');
    expect(Pie).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              backgroundColor: ['#111', '#222'],
              data: [1500, 150],
            },
          ],
          labels: ['Assets', 'Liabilities'],
        },
      }),
      {},
    );

    const { plugins } = (Pie as jest.Mock).mock.calls[0][0].options;
    expect(
      plugins.datalabels.formatter(100, { dataIndex: 0 }),
    ).toEqual('Assets\n€100.00');
  });

  it('works with expense', () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          { guid: '1', name: 'Groceries' },
          { guid: '2', name: 'Rent' },
          { guid: '3', name: 'Electricity' },
          { guid: '4', name: 'Water' },
        ],
      } as UseQueryResult<Account[]>,
    );
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          1: new Money(50, 'EUR'),
          2: new Money(500, 'EUR'),
          3: new Money(100, 'EUR'),
        } as AccountsTotals,
      } as UseQueryResult<AccountsTotals>,
    );

    render(
      <TotalsPie
        title="Total spent"
        showTooltip
        showDataLabels={false}
        guids={['1', '2', '3', '4']}
      />,
    );

    screen.getByText('€650.00');
    expect(Pie).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              data: [50, 500, 100, 0],
            },
          ],
          labels: ['Groceries', 'Rent', 'Electricity', 'Water'],
        },
      }),
      {},
    );

    const { plugins } = (Pie as jest.Mock).mock.calls[0][0].options;
    expect(plugins.datalabels.display).toBe(false);
    expect(plugins.tooltip.enabled).toBe(true);
    expect(plugins.tooltip.callbacks.label({ raw: '50' })).toEqual('€50.00 (7.69%)');
  });

  it('passes selectedDate', () => {
    const date = DateTime.fromISO('2023-01-01');
    render(
      <TotalsPie
        title=""
        guids={[]}
        selectedDate={date}
      />,
    );

    expect(apiHook.useAccountsTotals).toBeCalledWith(date);
  });
});