import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import { InvestmentInfo } from '@/components/pages/account';
import InvestmentChart from '@/components/pages/account/InvestmentChart';
import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account, Commodity } from '@/book/entities';
import { Price } from '@/book/entities';
import Money from '@/book/Money';
import * as apiHook from '@/hooks/api';
import { PriceDBMap } from '@/book/prices';
import type { InvestmentAccount } from '@/book/models';

jest.mock('@/components/pages/account/InvestmentChart', () => jest.fn(
  () => <div data-testid="InvestmentChart" />,
));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('InvestmentInfo', () => {
  let eur: Commodity;
  let ticker: Commodity;

  beforeEach(() => {
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount>);

    jest.spyOn(Price, 'create').mockImplementation();

    eur = {
      guid: 'eur_guid',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;

    ticker = {
      guid: 'ticker_guid',
      mnemonic: 'TICKER',
      namespace: 'OTHER',
    } as Commodity;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading when no data', async () => {
    render(
      <InvestmentInfo
        account={
          {
            guid: 'guid',
            commodity: eur,
          } as Account
        }
      />,
    );

    await screen.findByTestId('Loading');
  });

  it('renders as expected with data', async () => {
    const account = {
      guid: 'guid',
      commodity: ticker,
    } as Account;
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: {
        cost: new Money(100, 'EUR'),
        value: new Money(150, 'EUR'),
        unrealizedProfitAbs: new Money(50, 'EUR'),
        unrealizedProfitPct: 50,
        realizedProfit: new Money(10, 'EUR'),
        realizedProfitPct: 5,
        avgPrice: 10,
        quantity: new Money(10, 'TICKER'),
        account,
        currency: 'EUR',
        realizedDividends: new Money(20, 'EUR'),
        quoteInfo: {
          price: 15,
          date: DateTime.fromISO('2023-01-01'),
        },
      },
    } as UseQueryResult<InvestmentAccount>);

    const { container } = render(
      <InvestmentInfo account={account} />,
    );

    await screen.findByText('10 titles');
    await screen.findByText('€10.00');

    expect(InvestmentChart).toBeCalledWith(
      {
        account,
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'col-span-6',
        title: 'Value',
        statsTextClass: 'text-success',
        stats: '€150.00',
        description: 'from €100.00 invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'col-span-6',
        title: 'Closest price',
        statsTextClass: 'table-caption badge default',
        stats: '€15.00',
        description: 'on 1/1/2023',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'col-span-6',
        title: 'Unrealized Profit',
        statsTextClass: 'text-success',
        stats: '50 %',
        description: expect.anything(),
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      4,
      {
        className: 'col-span-6',
        title: 'Realized Profit',
        statsTextClass: 'text-success',
        stats: '€10.00',
        description: '+ €20.00 from dividends',
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('renders as expected when dividend with different currency', async () => {
    const account = {
      guid: 'guid',
      commodity: ticker,
    } as Account;
    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: {
        cost: new Money(100, 'EUR'),
        value: new Money(150, 'EUR'),
        unrealizedProfitAbs: new Money(50, 'EUR'),
        unrealizedProfitPct: 50,
        realizedProfit: new Money(10, 'EUR'),
        realizedProfitPct: 5,
        avgPrice: 10,
        quantity: new Money(10, 'TICKER'),
        account,
        currency: 'EUR',
        realizedDividends: new Money(20, 'USD'),
        quoteInfo: {
          price: 15,
          date: DateTime.fromISO('2023-01-01'),
        },
      },
    } as UseQueryResult<InvestmentAccount>);

    render(
      <InvestmentInfo account={account} />,
    );

    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      4,
      {
        className: 'col-span-6',
        title: 'Realized Profit',
        statsTextClass: 'text-success',
        stats: '€10.00',
        description: '+ $20.00 from dividends',
      },
      {},
    );
  });

  it('renders as expected when commodity is currency', async () => {
    const account = {
      guid: 'guid',
      commodity: eur,
    } as Account;

    jest.spyOn(apiHook, 'useInvestment').mockReturnValue({
      data: {
        cost: new Money(100, 'EUR'),
        value: new Money(150, 'EUR'),
        unrealizedProfitAbs: new Money(50, 'EUR'),
        unrealizedProfitPct: 50,
        realizedProfit: new Money(10, 'EUR'),
        realizedProfitPct: 5,
        avgPrice: 10,
        quantity: new Money(150, 'EUR'),
        account,
        currency: 'EUR',
        realizedDividends: new Money(20, 'EUR'),
        quoteInfo: {
          price: 1,
          date: DateTime.now(),
        },
      },
    } as UseQueryResult<InvestmentAccount>);

    const { container } = render(
      <InvestmentInfo account={account} />,
    );

    expect(container).toMatchSnapshot();
  });
});
