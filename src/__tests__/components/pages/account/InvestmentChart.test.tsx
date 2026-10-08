import React from 'react';
import { DateTime, Interval } from 'luxon';
import { render, screen } from '@testing-library/react';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

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
import * as stateHooks from '@/hooks/state';

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

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('InvestmentChart', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);

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
        account.splits,
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
    } as UseQueryResult<InvestmentAccount>);
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
        account.splits,
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
    } as UseQueryResult<InvestmentAccount>);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-04-01') as DateTime<true>);
    const interval = Interval.fromDateTimes(
      DateTime.now().minus({ months: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    );
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: interval } as DefinedUseQueryResult<Interval>);

    render(<InvestmentChart account={account} />);

    expect(Line).toBeCalledWith(
      {
        data: {
          labels: [
            interval.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            interval.end?.startOf('day'),
          ],
          datasets: [
            {
              label: 'Num. stocks',
              data: [
                {
                  x: 1667174400000,
                  y: 0,
                },
                {
                  x: 1669766400000,
                  y: 0,
                },
                {
                  x: 1672444800000,
                  y: 0,
                },
                {
                  x: 1672531200000,
                  y: 5,
                },
                {
                  x: 1675123200000,
                  y: 5,
                },
                {
                  x: 1677542400000,
                  y: 5,
                },
                {
                  x: 1680220800000,
                  y: 5,
                },
                {
                  x: 1680307200000,
                  y: 5,
                },
              ],
              yAxisID: 'yStocks',
              pointHoverRadius: 5,
              pointRadius: 5,
              pointStyle: 'rectRot',
              showLine: false,
              borderColor: 'rgba(124, 58, 237, 1)',
              backgroundColor: 'rgba(124, 58, 237, 1)',
              order: 0,
            },
            {
              label: 'Value',
              data: [
                {
                  x: 1667174400000,
                  y: 0,
                },
                {
                  x: 1669766400000,
                  y: 0,
                },
                {
                  x: 1672444800000,
                  y: 0,
                },
                {
                  x: 1672531200000,
                  y: 500,
                },
                {
                  x: 1675123200000,
                  y: 500,
                },
                {
                  x: 1677542400000,
                  y: 750,
                },
                {
                  x: 1680220800000,
                  y: 750,
                },
                {
                  x: 1680307200000,
                  y: 750,
                },
              ],
              yAxisID: 'yValue',
              fill: false,
              pointRadius: 3,
              pointHoverRadius: 3,
              borderColor: 'rgba(22, 163, 74)',
              backgroundColor: 'rgba(22, 163, 74)',
              order: 2,
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
              offset: true,
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
              min: interval?.start?.toISODate(),
              max: interval?.end?.toISODate(),
            },
            yStocks: {
              offset: true,
              beginAtZero: true,
              stackWeight: 2,
              stack: 'investment',
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
      undefined,
    );

    const { plugins } = (Line as jest.Mock).mock.calls[0][0].options;
    expect(plugins.tooltip.callbacks.label({ datasetIndex: 1, parsed: { y: 100 } })).toEqual('€100.00');
    expect(plugins.tooltip.callbacks.label({ datasetIndex: 0, parsed: { y: 100 } })).toEqual('100 GOOGL');
  });

  it('builds chart with expected data with robo advisor', () => {
    const eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;

    jest.spyOn(Price, 'create').mockReturnValue({
      guid: 'missing_price',
      date: DateTime.now(),
      value: 1,
      currency: eur,
      commodity: eur,
    } as Price);

    const account = {
      guid: 'guid',
      commodity: eur,
      splits: [
        // Contribution
        {
          guid: 'split1',
          quantity: 500,
          value: 500,
          transaction: {
            fk_currency: eur,
            currency: eur,
            date: DateTime.fromISO('2023-01-01'),
            splits: [
              {
                guid: 'split1',
                quantity: 500,
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
        // Price update
        {
          guid: 'split1',
          quantity: 250,
          value: 0,
          transaction: {
            fk_currency: eur,
            currency: eur,
            date: DateTime.fromISO('2023-02-01'),
            splits: [
              {
                guid: 'split1',
                quantity: 250,
                value: 0,
              },
            ],
          },
        },
      ] as Split[],
    } as Account;

    jest.spyOn(apiHook, 'usePrices').mockReturnValue({
      data: new PriceDBMap([]),
    } as UseQueryResult<PriceDBMap>);

    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: new InvestmentAccount(
        account,
        account.splits,
        'EUR',
        new PriceDBMap([]),
      ),
    } as UseQueryResult<InvestmentAccount>);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-04-01') as DateTime<true>);
    const interval = Interval.fromDateTimes(
      DateTime.now().minus({ months: 6 }).startOf('month'),
      DateTime.now().endOf('day'),
    );
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: interval } as DefinedUseQueryResult<Interval>);

    render(<InvestmentChart account={account} />);

    expect(Line).toBeCalledWith(
      {
        data: {
          labels: [
            interval.start,
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            expect.any(DateTime),
            interval.end?.startOf('day'),
          ],
          datasets: [
            expect.objectContaining({
              label: 'Contributed',
              data: [
                {
                  x: 1667174400000,
                  y: 0,
                },
                {
                  x: 1669766400000,
                  y: 0,
                },
                {
                  x: 1672444800000,
                  y: 0,
                },
                {
                  x: 1672531200000,
                  y: 500,
                },
                {
                  x: 1675123200000,
                  y: 500,
                },
                {
                  x: 1675209600000,
                  y: 500,
                },
                {
                  x: 1677542400000,
                  y: 500,
                },
                {
                  x: 1680220800000,
                  y: 500,
                },
                {
                  x: 1680307200000,
                  y: 500,
                },
              ],
            }),
            expect.objectContaining({
              label: 'Value',
              data: [
                {
                  x: 1667174400000,
                  y: 0,
                },
                {
                  x: 1669766400000,
                  y: 0,
                },
                {
                  x: 1672444800000,
                  y: 0,
                },
                {
                  x: 1672531200000,
                  y: 500,
                },
                {
                  x: 1675123200000,
                  y: 500,
                },
                {
                  x: 1675209600000,
                  y: 750,
                },
                {
                  x: 1677542400000,
                  y: 750,
                },
                {
                  x: 1680220800000,
                  y: 750,
                },
                {
                  x: 1680307200000,
                  y: 750,
                },
              ],
            }),
          ],
        },
        options: expect.objectContaining({
          scales: {
            x: {
              offset: true,
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
              min: interval?.start?.toISODate(),
              max: interval?.end?.toISODate(),
            },
            yStocks: {
              offset: true,
              beginAtZero: true,
              stackWeight: 2,
              stack: 'investment',
              border: {
                display: false,
              },
              ticks: {
                color: 'rgba(124, 58, 237, 1)',
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
        }),
      },
      undefined,
    );
  });
});
