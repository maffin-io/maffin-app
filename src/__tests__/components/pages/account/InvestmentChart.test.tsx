import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import Line from '@/components/charts/Line';
import type { Account, Split, Price } from '@/book/entities';
import InvestmentChart from '@/components/pages/account/InvestmentChart';
import { InvestmentAccount } from '@/book/models';
import { PriceDBMap } from '@/book/prices';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/charts/Line', () => jest.fn(
  () => <div data-testid="Line" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('InvestmentChart', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading when no data', async () => {
    render(
      <InvestmentChart
        account={
          {
            guid: 'guid',
            commodity: {
              guid: 'eur_guid',
              mnemonic: 'EUR',
            },
          } as Account
        }
      />,
    );

    await screen.findByTestId('Loading');
  });

  it('displays no txs message when no splits', async () => {
    const eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
    };
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({
      data: [
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 100,
          currency: eur,
        },
      ],
    } as SWRResponse);

    const account = {
      guid: 'guid',
      commodity: {
        guid: 'googl_guid',
        mnemonic: 'GOOGL',
      },
      splits: [] as Split[],
    } as Account;
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({
      data: [
        new InvestmentAccount(
          account,
          'EUR',
          new PriceDBMap([
            // @ts-ignore
            {
              date: DateTime.now(),
              value: 100,
              fk_commodity: account.commodity,
              commodity: account.commodity,
              fk_currency: eur,
              currency: eur,
              quoteInfo: 'maffin::',
            } as Price,
          ]),
        ),
      ],
    } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-02-02') as DateTime<true>);

    render(
      <InvestmentChart
        account={account}
      />,
    );

    await screen.findByText('You don\'t have any transactions for this investment yet!');
  });

  it('builds chart with expected data', () => {
    const eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
    };
    const account = {
      guid: 'guid',
      commodity: {
        guid: 'googl_guid',
        mnemonic: 'GOOGL',
      },
      splits: [
        {
          guid: 'split1',
          quantity: 5,
          value: 500,
          transaction: {
            fk_currency: eur,
            currency: eur,
            date: DateTime.fromISO('2023-01-01'),
            splits: [
              {
                guid: 'split1',
                quantity: 5,
                value: 500,
              },
              {
                guid: 'split2',
                quantity: -500,
                value: -500,
              },
            ],
          },
        },
      ] as Split[],
    } as Account;
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({
      data: [
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 100,
          currency: eur,
        },
        {
          date: DateTime.fromISO('2023-02-01'),
          value: 150,
          currency: eur,
        },
      ],
    } as SWRResponse);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({
      data: [
        new InvestmentAccount(
          account,
          'EUR',
          new PriceDBMap([
            // @ts-ignore
            {
              date: DateTime.now(),
              value: 100,
              fk_commodity: account.commodity,
              commodity: account.commodity,
              fk_currency: eur,
              currency: eur,
              quoteInfo: 'maffin::',
            } as Price,
          ]),
        ),
      ],
    } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-02-02') as DateTime<true>);

    render(
      <InvestmentChart
        account={account}
      />,
    );

    expect(Line).toBeCalledWith(
      {
        height: '400px',
        data: {
          datasets: [
            {
              label: 'Num. stocks',
              data: [
                {
                  x: 1672531200000,
                  y: 5,
                },
                {
                  x: 1675209600000,
                  y: 5,
                },
              ],
              yAxisID: 'yStocks',
              // @ts-ignore
              type: 'bar',
              borderColor: 'rgba(124, 58, 237, 1)',
              backgroundColor: 'rgba(124, 58, 237, 1)',
              order: 0,
            },
            {
              label: 'Price',
              data: [
                {
                  x: 1672531200000,
                  y: 100,
                },
                {
                  x: 1675209600000,
                  y: 150,
                },
              ],
              yAxisID: 'yPrice',
              pointStyle: 'circle',
              tension: 0.4,
              cubicInterpolationMode: 'monotone',
              fill: false,
              borderColor: 'rgba(234, 88, 12, 1)',
              backgroundColor: 'rgba(234, 88, 12, 1)',
              order: 1,
            },
            {
              label: 'Value',
              data: [
                {
                  x: 1672531200000,
                  y: 500,
                },
                {
                  x: 1675209600000,
                  y: 750,
                },
              ],
              yAxisID: 'yValue',
              fill: false,
              pointRadius: 5,
              borderColor: 'rgba(22, 163, 74)',
              backgroundColor: 'rgba(22, 163, 74)',
              order: 2,
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
              display: true,
              onClick: expect.any(Function),
              labels: {
                pointStyle: 'circle',
                usePointStyle: true,
              },
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
              type: 'time',
              time: {
                unit: 'month',
                tooltipFormat: 'dd MMMM yyyy',
                displayFormats: {
                  month: 'MMM-yy',
                },
              },
              grid: {
                offset: false,
              },
              border: {
                display: false,
              },
              min: '2023-01-01',
            },
            yStocks: {
              offset: true,
              beginAtZero: true,
              stackWeight: 2,
              stack: 'investment',
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                color: 'rgba(124, 58, 237, 1)',
                callback: expect.any(Function),
              },
            },
            yPrice: {
              offset: true,
              stackWeight: 4,
              stack: 'investment',
              border: {
                display: false,
              },
              ticks: {
                color: 'rgba(234, 88, 12, 0.7)',
                maxTicksLimit: 10,
                callback: expect.any(Function),
              },
            },
            yValue: {
              offset: true,
              stackWeight: 4,
              stack: 'investment',
              border: {
                display: false,
              },
              ticks: {
                color: 'rgba(22, 163, 74)',
                maxTicksLimit: 10,
                callback: expect.any(Function),
              },
            },
          },
        },
      },
      {},
    );
  });
});
