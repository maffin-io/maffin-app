import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import Money from '@/book/Money';
import Pie from '@/components/charts/Pie';
import { NetWorthPie } from '@/components/pages/accounts';
import * as apiHook from '@/hooks/api';
import type { Commodity } from '@/book/entities';
import type { MonthlyTotals } from '@/lib/queries';

jest.mock('@/components/charts/Pie', () => jest.fn(
  () => <div data-testid="Pie" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('NetWorthPie', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({ data: undefined } as UseQueryResult<MonthlyTotals>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Pie with no data when no data', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    render(<NetWorthPie />);

    expect(Pie).toBeCalledWith(
      {
        data: {
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [0, 0],
            },
          ],
          labels: ['Assets', 'Liabilities'],
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
              borderRadius: 2,
              color: '#DDDDDD',
              formatter: expect.any(Function),
              padding: 6,
              textAlign: 'center',
            },
            tooltip: {
              enabled: false,
            },
          },
        },
      },
      {},
    );
  });

  it('shows net worth as expected', () => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-02-20') as DateTime<true>);
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(1000, 'EUR'),
          },
          liability: {
            '01/2023': new Money(-50, 'EUR'),
            '02/2023': new Money(-100, 'EUR'),
          },
        } as MonthlyTotals,
      } as UseQueryResult<MonthlyTotals>,
    );

    render(<NetWorthPie />);

    expect(Pie).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [1000, 100],
            },
          ],
          labels: ['Assets', 'Liabilities'],
        },
      }),
      {},
    );
  });

  it('shows net worth when no liabilities', () => {
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(1000, 'EUR'),
          },
        } as MonthlyTotals,
      } as UseQueryResult<MonthlyTotals>,
    );

    render(<NetWorthPie />);

    expect(Pie).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [1000, 0],
            },
          ],
          labels: ['Assets', 'Liabilities'],
        },
      }),
      {},
    );
  });

  it('filters by selected date', () => {
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue(
      {
        data: {
          asset: {
            '01/2023': new Money(500, 'EUR'),
            '02/2023': new Money(1000, 'EUR'),
          },
          liability: {
            '01/2023': new Money(-50, 'EUR'),
            '02/2023': new Money(-100, 'EUR'),
          },
        } as MonthlyTotals,
      } as UseQueryResult<MonthlyTotals>,
    );

    render(
      <NetWorthPie
        selectedDate={DateTime.fromISO('2023-01-01')}
      />,
    );

    expect(Pie).toBeCalledWith(
      expect.objectContaining({
        data: {
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [500, 50],
            },
          ],
          labels: ['Assets', 'Liabilities'],
        },
      }),
      {},
    );
  });
});
