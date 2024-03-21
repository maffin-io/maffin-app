import React from 'react';
import { render } from '@testing-library/react';
import { Interval } from 'luxon';
import type { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';

import EarnWidget from '@/components/pages/account/EarnWidget';
import StatisticsWidget from '@/components/StatisticsWidget';
import * as apiHook from '@/hooks/api';
import * as stateHooks from '@/hooks/state';
import type { Account, Commodity } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

describe('EarnWidgetTest', () => {
  let account: Account;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useCashFlow').mockReturnValue({ data: undefined } as UseQueryResult<{ guid: string, total: number, type: string, name: string }[]>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);

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
    render(<EarnWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€0.00',
        title: 'Money in',
      },
      {},
    );
  });

  it('renders as expected', () => {
    jest.spyOn(apiHook, 'useMainCurrency').mockReturnValue({ data: { mnemonic: 'EUR' } } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'useCashFlow')
      .mockReturnValueOnce({
        data: [
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: -30,
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: 20,
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: 20,
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: 30,
          },
        ],
      } as UseQueryResult<{ guid: string, total: number, type: string, name: string }[]>)
      .mockReturnValueOnce({
        data: [
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: -20,
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: 10,
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: 20,
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: 30,
          },
        ],
      } as UseQueryResult<{ guid: string, total: number, type: string, name: string }[]>);

    render(<EarnWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€30.00',
        title: 'Money in',
      },
      {},
    );
  });
});
