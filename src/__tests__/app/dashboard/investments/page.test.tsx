import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import { Commodity } from '@/book/entities';
import InvestmentsPage from '@/app/dashboard/investments/page';
import StatisticsWidget from '@/components/StatisticsWidget';
import {
  WeightsChart,
  DividendChart,
  InvestmentsTable,
} from '@/components/pages/investments';
import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/pages/investments/WeightsChart', () => jest.fn(
  () => <div data-testid="WeightsChart" />,
));
const WeightsChartMock = WeightsChart as jest.MockedFunction<typeof WeightsChart>;

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/pages/investments/DividendChart', () => jest.fn(
  () => <div data-testid="DividendChart" />,
));

jest.mock('@/components/pages/investments/InvestmentsTable', () => jest.fn(
  () => <div data-testid="InvestmentsTable" />,
));

describe('InvestmentsPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined, isLoading: false } as SWRResponse);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading when investments not loaded', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ isLoading: true } as SWRResponse);
    render(<InvestmentsPage />);

    screen.getByText('Loading...');
  });

  it('shows no investments message', () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined, isLoading: false } as SWRResponse);
    render(<InvestmentsPage />);

    screen.getByText('You have no investments yet!');
  });

  it('renders with data', async () => {
    const mainCurrency = {
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity;

    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'EUR'),
      costInCurrency: new Money(4, 'EUR'),
      realizedProfitInCurrency: new Money(10, 'EUR'),
      realizedDividendsInCurrency: new Money(5, 'EUR'),
    } as InvestmentAccount;

    jest.spyOn(apiHook, 'useInvestments').mockReturnValueOnce({ data: [investment1] } as SWRResponse);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValueOnce({ data: mainCurrency } as SWRResponse);

    const { container } = render(<InvestmentsPage />);

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChart).toHaveBeenCalledWith(
      {
        investments: [investment1],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[0][0].totalValue.toString()).toEqual('5.00 EUR');
    expect(StatisticsWidget).toBeCalledTimes(3);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'ml-6',
        title: 'Value/Cost',
        stats: '€5.00',
        description: '€4.00 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'ml-6',
        title: 'Unrealized Profit',
        stats: '€1.00 (25%)',
        description: '€6.00 (150%) with dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'mx-6',
        title: 'Realized',
        stats: '€15.00',
        description: '€5.00 from dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(DividendChart).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
      },
      {},
    );
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with different mainCurrency', async () => {
    const mainCurrency = {
      mnemonic: 'USD',
      guid: 'usd',
      namespace: 'CURRENCY',
    } as Commodity;

    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'USD'),
      costInCurrency: new Money(4, 'USD'),
      realizedProfitInCurrency: new Money(10, 'USD'),
      realizedDividendsInCurrency: new Money(5, 'USD'),
    } as InvestmentAccount;

    jest.spyOn(apiHook, 'useInvestments').mockReturnValueOnce({ data: [investment1] } as SWRResponse);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValueOnce({ data: mainCurrency } as SWRResponse);

    const { container } = render(<InvestmentsPage />);

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChart).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[0][0].totalValue.toString()).toEqual('5.00 USD');
    expect(StatisticsWidget).toBeCalledTimes(3);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'ml-6',
        title: 'Value/Cost',
        stats: '$5.00',
        description: '$4.00 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'ml-6',
        title: 'Unrealized Profit',
        stats: '$1.00 (25%)',
        description: '$6.00 (150%) with dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'mx-6',
        title: 'Realized',
        stats: '$15.00',
        description: '$5.00 from dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(DividendChart).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
      },
      {},
    );
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('doesnt pass empty positions to investments table', async () => {
    const mainCurrency = {
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity;

    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(0, 'TICKER'),
      valueInCurrency: new Money(0, 'EUR'),
      costInCurrency: new Money(0, 'EUR'),
      realizedProfitInCurrency: new Money(10, 'EUR'),
      realizedDividendsInCurrency: new Money(5, 'EUR'),
    } as InvestmentAccount;

    jest.spyOn(apiHook, 'useInvestments').mockReturnValueOnce({ data: [investment1] } as SWRResponse);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValueOnce({ data: mainCurrency } as SWRResponse);

    render(<InvestmentsPage />);

    await screen.findByTestId('InvestmentsTable');
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        investments: [],
      },
      {},
    );
  });
});
