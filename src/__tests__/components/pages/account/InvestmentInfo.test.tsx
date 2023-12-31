import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import { InvestmentInfo } from '@/components/pages/account';
import InvestmentChart from '@/components/pages/account/InvestmentChart';
import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import * as apiHook from '@/hooks/api';

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
  beforeEach(() => {
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as SWRResponse);
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

  it('renders as expected with data', async () => {
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
    } as Account;
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({
      data: [
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 10,
          currency: eur,
        },
        {
          date: DateTime.fromISO('2023-02-01'),
          value: 15,
          currency: eur,
        },
      ],
    } as SWRResponse);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({
      data: [
        {
          cost: new Money(100, 'EUR'),
          value: new Money(150, 'EUR'),
          profitAbs: new Money(50, 'EUR'),
          profitPct: 50,
          avgPrice: 10,
          quantity: new Money(10, 'GOOGL'),
          account,
          currency: 'EUR',
          realizedDividends: new Money(20, 'EUR'),
        },
      ],
    } as SWRResponse);

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
        title: 'Latest known price',
        statsTextClass: 'table-caption badge',
        stats: '€15.00',
        description: 'on 2/1/2023',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'col-span-6',
        title: 'Current value is',
        statsTextClass: 'amount-positive',
        stats: '€150.00',
        description: 'from €100.00 invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'col-span-7',
        title: 'Unrealized Profit',
        statsTextClass: 'amount-positive',
        stats: '€50.00 (50%)',
        description: '',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      4,
      {
        className: 'col-span-5',
        title: 'Total Dividends',
        statsTextClass: 'badge',
        stats: '€20.00',
        description: '',
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('renders as expected when dividend with different currency', async () => {
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
    } as Account;
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({
      data: [
        {
          date: DateTime.fromISO('2023-01-01'),
          value: 10,
          currency: eur,
        },
        {
          date: DateTime.fromISO('2023-02-01'),
          value: 15,
          currency: eur,
        },
      ],
    } as SWRResponse);
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({
      data: [
        {
          cost: new Money(100, 'EUR'),
          value: new Money(150, 'EUR'),
          profitAbs: new Money(50, 'EUR'),
          profitPct: 50,
          avgPrice: 10,
          quantity: new Money(10, 'GOOGL'),
          account,
          currency: 'EUR',
          realizedDividends: new Money(20, 'USD'),
        },
      ],
    } as SWRResponse);

    render(
      <InvestmentInfo account={account} />,
    );

    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      4,
      {
        className: 'col-span-5',
        title: 'Total Dividends',
        statsTextClass: 'badge',
        stats: '$20.00',
        description: '',
      },
      {},
    );
  });
});
