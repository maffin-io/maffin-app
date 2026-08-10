import React from 'react';
import { render } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import SpendWidget from '@/components/pages/account/SpendWidget';
import StatisticsWidget from '@/components/StatisticsWidget';
import * as apiHook from '@/hooks/api';
import type { Account, Commodity } from '@/book/entities';
import type { CashFlowRow } from '@/hooks/api/useCashFlow';
import Money from '@/book/Money';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

describe('SpendWidgetTest', () => {
  let account: Account;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useCashFlow').mockReturnValue({ data: undefined } as UseQueryResult<CashFlowRow[]>);
    account = {
      guid: 'guid',
      commodity: {
        mnemonic: 'EUR',
      } as Commodity,
    } as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no data', () => {
    render(<SpendWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€0.00',
        title: 'Expenses',
      },
      undefined,
    );
  });

  it('renders as expected', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useCashFlow')
      // period cash flow
      .mockReturnValueOnce({
        data: [
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: new Money(-20, 'EUR'),
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: new Money(20, 'EUR'),
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: new Money(20, 'EUR'),
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: new Money(30, 'EUR'),
          },
        ],
      } as UseQueryResult<CashFlowRow[]>)
      // last month cash flow
      .mockReturnValueOnce({
        data: [
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: new Money(-20, 'EUR'),
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: new Money(10, 'EUR'),
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: new Money(20, 'EUR'),
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: new Money(30, 'EUR'),
          },
        ],
      } as UseQueryResult<CashFlowRow[]>);

    render(<SpendWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€20.00',
        title: 'Expenses',
      },
      undefined,
    );
  });
});
