import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';
import type { SWRResponse } from 'swr';
import type { UseQueryResult } from '@tanstack/react-query';

import Line from '@/components/charts/Line';
import {
  Account,
  Split,
  Price,
  Commodity,
} from '@/book/entities';
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
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(Price, 'create').mockReturnValue({
      guid: 'missing_price',
      date: DateTime.now(),
      value: 1,
    } as Price);
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
      data: new PriceDBMap([
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 100,
          commodity: {
            mnemonic: 'USD',
          },
          currency: eur,
        } as Price,
      ]),
    } as UseQueryResult<PriceDBMap>);

    const account = {
      guid: 'guid',
      commodity: {
        guid: 'googl_guid',
        mnemonic: 'GOOGL',
      },
      splits: [] as Split[],
    } as Account;
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: new InvestmentAccount(
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
    } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-02-02') as DateTime<true>);

    render(
      <InvestmentChart
        account={account}
      />,
    );

    await screen.findByText('You don\'t have any transactions for this investment yet!');
  });

  it('builds chart with expected data for period longer than 3 months', () => {
    const eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;
    const googl = {
      guid: 'googl_guid',
      mnemonic: 'GOOGL',
      namespace: 'INVESTMENT',
    } as Commodity;

    const account = {
      guid: 'guid',
      commodity: googl,
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
      data: new PriceDBMap([
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 100,
          currency: eur,
          commodity: googl,
        } as Price,
        {
          date: DateTime.fromISO('2023-02-01'),
          value: 150,
          currency: eur,
          commodity: googl,
        } as Price,
      ]),
    } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: new InvestmentAccount(
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
    } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-04-01') as DateTime<true>);

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
                {
                  x: 1677628800000,
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
                {
                  x: 1677628800000,
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

  it('builds chart with expected data for period shorter than 3 months', () => {
    const eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;
    const googl = {
      guid: 'googl_guid',
      mnemonic: 'GOOGL',
      namespace: 'STOCK',
    } as Commodity;

    const account = {
      guid: 'guid',
      commodity: googl,
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
      data: new PriceDBMap([
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 100,
          currency: eur,
          commodity: googl,
        } as Price,
        {
          date: DateTime.fromISO('2023-01-03'),
          value: 150,
          currency: eur,
          commodity: googl,
        } as Price,
      ]),
    } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: new InvestmentAccount(
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
    } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-04') as DateTime<true>);

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
                  x: 1672617600000,
                  y: 5,
                },
                {
                  x: 1672704000000,
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
                  x: 1672704000000,
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
                  x: 1672617600000,
                  y: 500,
                },
                {
                  x: 1672704000000,
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
