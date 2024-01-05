import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import type { Account, Split } from '@/book/entities';
import Bar from '@/components/charts/Bar';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Bar', () => jest.fn(
  () => <div data-testid="Bar" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('SplitsHistogram', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-12-31') as DateTime<true>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Bar with no data', () => {
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

    expect(Bar).toBeCalledWith(
      {
        data: {
          datasets: [],
          labels: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ],
        },
        options: {
          plugins: {
            datalabels: {
              display: false,
            },
            legend: {
              labels: {
                boxWidth: 12,
              },
              position: 'bottom',
            },
            title: {
              align: 'start',
              display: true,
              font: {
                size: 16,
              },
              padding: {
                bottom: 30,
              },
              text: 'Monthly movements',
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
            },
            y: {
              border: {
                display: false,
              },
              ticks: {
                callback: expect.any(Function),
                maxTicksLimit: 10,
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

    expect(Bar).toBeCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: [
            {
              data: [-200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              label: '2022',
              hidden: true,
            },
            {
              data: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              label: '2023',
              hidden: false,
            },
          ],
        }),
      }),
      {},
    );
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
