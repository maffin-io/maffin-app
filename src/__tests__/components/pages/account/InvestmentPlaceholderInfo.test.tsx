import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { Account, Commodity } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import {
  WeightsChart,
  DividendChart,
} from '@/components/charts';
import { InvestmentsTable } from '@/components/tables';
import Money from '@/book/Money';
import { InvestmentAccount } from '@/book/models';
import { InvestmentPlaceholderInfo } from '@/components/pages/account';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/charts/WeightsChart', () => jest.fn(
  () => <div data-testid="WeightsChart" />,
));
const WeightsChartMock = WeightsChart as jest.MockedFunction<typeof WeightsChart>;

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/charts/DividendChart', () => jest.fn(
  () => <div data-testid="DividendChart" />,
));

jest.mock('@/components/tables/InvestmentsTable', () => jest.fn(
  () => <div data-testid="InvestmentsTable" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('InvestmentPlaceholderInfo', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: undefined } as UseQueryResult<InvestmentAccount[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ isPending: true } as UseQueryResult<InvestmentAccount[]>);
    render(<InvestmentPlaceholderInfo account={{ guid: 'guid' } as Account} />);

    await screen.findByTestId('Loading');
  });

  it('renders with no investments', async () => {
    jest.spyOn(apiHook, 'useInvestments').mockReturnValue({ data: [] as InvestmentAccount[] } as UseQueryResult<InvestmentAccount[]>);
    render(<InvestmentPlaceholderInfo account={{ guid: 'guid' } as Account} />);
    await screen.findByText('You have no investments yet!');
  });

  it('renders with data', async () => {
    const mainCurrency = {
      mnemonic: 'EUR',
      guid: 'eur',
      namespace: 'CURRENCY',
    } as Commodity;

    const investment1 = {
      account: { guid: 'guid1', name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'EUR'),
      costInCurrency: new Money(4, 'EUR'),
      realizedProfitInCurrency: new Money(10, 'EUR'),
      realizedDividendsInCurrency: new Money(5, 'EUR'),
    } as InvestmentAccount;

    jest.spyOn(apiHook, 'useInvestments').mockReturnValueOnce({ data: [investment1] } as UseQueryResult<InvestmentAccount[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: mainCurrency } as UseQueryResult<Commodity>);

    const { container } = render(<InvestmentPlaceholderInfo account={{ childrenIds: ['guid1'] } as Account} />);

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChart).toHaveBeenCalledWith(
      {
        accounts: [investment1.account.guid],
        totalValue: expect.any(Money),
      },
      {},
    );
    expect(WeightsChartMock.mock.calls[0][0].totalValue.toString()).toEqual('5 EUR');
    expect(StatisticsWidget).toBeCalledTimes(3);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'Value/Cost',
        stats: '€5.00',
        description: '€4.00 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'mr-2',
        title: 'Unrealized Profit',
        stats: '€1.00 (25%)',
        description: '€6.00 (150%) with dividends',
        statsTextClass: 'amount-positive',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'mr-2',
        title: 'Realized',
        stats: '€15.00',
        description: '€5.00 from dividends',
        statsTextClass: 'amount-positive',
      },
      {},
    );
    expect(DividendChart).toHaveBeenLastCalledWith(
      {
        accounts: [investment1.account.guid],
      },
      {},
    );
    expect(InvestmentsTable).toHaveBeenLastCalledWith(
      {
        accounts: [investment1.account.guid],
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
      account: { guid: 'guid1', name: 'Investment' },
      quantity: new Money(10, 'TICKER'),
      valueInCurrency: new Money(5, 'USD'),
      costInCurrency: new Money(4, 'USD'),
      realizedProfitInCurrency: new Money(10, 'USD'),
      realizedDividendsInCurrency: new Money(5, 'USD'),
    } as InvestmentAccount;

    jest.spyOn(apiHook, 'useInvestments').mockReturnValueOnce({ data: [investment1] } as UseQueryResult<InvestmentAccount[]>);
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: mainCurrency } as UseQueryResult<Commodity>);

    render(<InvestmentPlaceholderInfo account={{ childrenIds: ['guid1'] } as Account} />);

    await screen.findByTestId('InvestmentsTable');
    expect(WeightsChartMock.mock.calls[0][0].totalValue.toString()).toEqual('5 USD');
    expect(StatisticsWidget).toBeCalledTimes(3);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'Value/Cost',
        stats: '$5.00',
        description: '$4.00 total invested',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        className: 'mr-2',
        title: 'Unrealized Profit',
        stats: '$1.00 (25%)',
        description: '$6.00 (150%) with dividends',
        statsTextClass: 'amount-positive',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      3,
      {
        className: 'mr-2',
        title: 'Realized',
        stats: '$15.00',
        description: '$5.00 from dividends',
        statsTextClass: 'amount-positive',
      },
      {},
    );
  });
});
