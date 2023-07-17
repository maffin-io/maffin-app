import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { Commodity } from '@/book/entities';
import InvestmentsPage from '@/app/dashboard/investments/page';
import { WeightsChartProps } from '@/components/equities/WeightsChart';
import { StatisticsWidgetProps } from '@/components/equities/StatisticsWidget';
import { InvestmentsTableProps } from '@/components/equities/InvestmentsTable';
import { DividendChartProps } from '@/components/equities/DividendChart';
import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/book/queries';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/equities/WeightsChart', () => {
  function WeightsChart({ investments, totalValue }: WeightsChartProps) {
    return (
      <div className="WeightsChart" data-investments="">
        <span>{JSON.stringify(investments)}</span>
        <span>{totalValue.toString()}</span>
      </div>
    );
  }

  return WeightsChart;
});

jest.mock('@/components/equities/StatisticsWidget', () => {
  function StatisticsWidget(props: StatisticsWidgetProps) {
    return (
      <div className="StatisticsWidget">
        <span>{props.description}</span>
        <span>{props.title}</span>
        <span>{props.stats}</span>
        <span>{props.description}</span>
      </div>
    );
  }

  return StatisticsWidget;
});

jest.mock('@/components/equities/InvestmentsTable', () => {
  function InvestmentsTable({ investments }: InvestmentsTableProps) {
    return (
      <div className="InvestmentsTable">
        <span>{JSON.stringify(investments)}</span>
      </div>
    );
  }

  return InvestmentsTable;
});

jest.mock('@/components/equities/DividendChart', () => {
  function DividendChart({ investments }: DividendChartProps) {
    return (
      <div className="DividendChart">
        <span>{JSON.stringify(investments)}</span>
      </div>
    );
  }

  return DividendChart;
});

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

    expect(container).toMatchSnapshot();
  });

  it('renders with data', async () => {
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity);
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([
      {
        account: { name: 'Investment' },
        quantity: new Money(10, 'TICKER'),
        valueInCurrency: new Money(5, 'EUR'),
        costInCurrency: new Money(4, 'EUR'),
        realizedProfitInCurrency: new Money(10, 'EUR'),
        realizedDividendsInCurrency: new Money(5, 'EUR'),
      } as InvestmentAccount,
    ]);

    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    await screen.findByText('5.00 EUR');
    expect(container).toMatchSnapshot();
  });

  it('renders with different mainCurrency', async () => {
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue({
      mnemonic: 'USD',
      guid: 'usd',
      namespace: 'CURRENCY',
    } as Commodity);
    jest.spyOn(queries, 'getInvestments').mockResolvedValue([
      {
        account: { name: 'Investment' },
        quantity: new Money(10, 'TICKER'),
        valueInCurrency: new Money(5, 'USD'),
        costInCurrency: new Money(4, 'USD'),
        realizedProfitInCurrency: new Money(10, 'USD'),
        realizedDividendsInCurrency: new Money(5, 'USD'),
      } as InvestmentAccount,
    ]);

    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InvestmentsPage />
      </SWRConfig>,
    );

    await screen.findByText('5.00 USD');
    expect(container).toMatchSnapshot();
  });
});
