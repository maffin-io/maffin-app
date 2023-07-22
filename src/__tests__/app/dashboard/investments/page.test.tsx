import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { Commodity } from '@/book/entities';
import InvestmentsPage from '@/app/dashboard/investments/page';
import WeightsChart from '@/components/equities/WeightsChart';
import StatisticsWidget from '@/components/equities/StatisticsWidget';
import InvestmentsTable from '@/components/equities/InvestmentsTable';
import DividendChart from '@/components/equities/DividendChart';
import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/book/queries';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/equities/WeightsChart', () => jest.fn(
  () => <div data-testid="WeightsChart" />,
));
const WeightsChartMock = WeightsChart as jest.MockedFunction<typeof WeightsChart>;

jest.mock('@/components/equities/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/equities/DividendChart', () => jest.fn(
  () => <div data-testid="DividendChart" />,
));

jest.mock('@/components/equities/InvestmentsTable', () => jest.fn(
  () => <div data-testid="InvestmentsTable" />,
));

describe('InvestmentsPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders while loading data', () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    expect(WeightsChart).toHaveBeenLastCalledWith(
      {
        investments: [],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[0][0].totalValue.toString()).toEqual('0.00 EUR');
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mx-6',
        title: 'Value/Cost',
        stats: '0.00 €',
        description: '0 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'mx-6',
        title: 'Unrealized Profit',
        stats: '0.00 € (NaN%)',
        description: '0 (NaN%) with dividends',
        statsTextClass: '',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'mx-6',
        title: 'Realized',
        stats: '0.00 €',
        description: '0.00 € from dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(DividendChart).toHaveBeenLastCalledWith(
      {
        investments: [],
      },
      {},
    );
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        investments: [],
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with data', async () => {
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity);
    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'EUR'),
      costInCurrency: new Money(4, 'EUR'),
      realizedProfitInCurrency: new Money(10, 'EUR'),
      realizedDividendsInCurrency: new Money(5, 'EUR'),
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment1]);

    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChart).toBeCalledTimes(3);
    expect(WeightsChart).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[2][0].totalValue.toString()).toEqual('5.00 EUR');
    expect(StatisticsWidget).toBeCalledTimes(9);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      7,
      {
        className: 'mx-6',
        title: 'Value/Cost',
        stats: '5.00 €',
        description: '4 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      8,
      {
        className: 'mx-6',
        title: 'Unrealized Profit',
        stats: '1.00 € (25%)',
        description: '6 (150%) with dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      9,
      {
        className: 'mx-6',
        title: 'Realized',
        stats: '15.00 €',
        description: '5.00 € from dividends',
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
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      mnemonic: 'USD',
      guid: 'usd',
      namespace: 'CURRENCY',
    } as Commodity);
    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'USD'),
      costInCurrency: new Money(4, 'USD'),
      realizedProfitInCurrency: new Money(10, 'USD'),
      realizedDividendsInCurrency: new Money(5, 'USD'),
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment1]);

    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChart).toBeCalledTimes(3);
    expect(WeightsChart).toHaveBeenLastCalledWith(
      {
        investments: [investment1],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[2][0].totalValue.toString()).toEqual('5.00 USD');
    expect(StatisticsWidget).toBeCalledTimes(9);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      7,
      {
        className: 'mx-6',
        title: 'Value/Cost',
        stats: '5.00 $',
        description: '4 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      8,
      {
        className: 'mx-6',
        title: 'Unrealized Profit',
        stats: '1.00 $ (25%)',
        description: '6 (150%) with dividends',
        statsTextClass: 'text-green-500',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      9,
      {
        className: 'mx-6',
        title: 'Realized',
        stats: '15.00 $',
        description: '5.00 $ from dividends',
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
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity);
    const investment1 = {
      account: { name: 'Investment' },
      quantity: new Money(0, 'TICKER'),
      valueInCurrency: new Money(0, 'EUR'),
      costInCurrency: new Money(0, 'EUR'),
      realizedProfitInCurrency: new Money(10, 'EUR'),
      realizedDividendsInCurrency: new Money(5, 'EUR'),
    } as InvestmentAccount;
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([investment1]);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    await screen.findByTestId('InvestmentsTable');
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        investments: [],
      },
      {},
    );
  });
});
