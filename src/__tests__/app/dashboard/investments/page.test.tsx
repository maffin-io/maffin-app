import React from 'react';
import { render, act } from '@testing-library/react';
import type { DataSource } from 'typeorm';

import { Commodity } from '@/book/entities';
import InvestmentsPage from '@/app/dashboard/investments/page';
import { WeightsChartProps } from '@/components/equities/WeightsChart';
import { StatisticsWidgetProps } from '@/components/equities/StatisticsWidget';
import { InvestmentsTableProps } from '@/components/equities/InvestmentsTable';
import { DividendChartProps } from '@/components/equities/DividendChart';
import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/book/queries';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
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
  it('renders while loading data', () => {
    const { container } = render(
      <InvestmentsPage />,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders with data', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
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

    let container;
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      ({ container } = render(
        <InvestmentsPage />,
      ));
    });

    expect(container).toMatchSnapshot();
  });

  it('renders with different mainCurrency', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
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

    let container;
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      ({ container } = render(
        <InvestmentsPage />,
      ));
    });

    expect(container).toMatchSnapshot();
  });
});
