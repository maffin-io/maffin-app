import React from 'react';
import { render } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import TotalWidget from '@/components/pages/account/TotalWidget';
import StatisticsWidget from '@/components/StatisticsWidget';
import * as apiHook from '@/hooks/api';
import Money from '@/book/Money';
import type { AccountsTotals } from '@/types/book';
import type { Account, Commodity } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

describe('TotalWidgetTest', () => {
  let account: Account;

  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({ data: undefined } as UseQueryResult<AccountsTotals>);
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
    render(<TotalWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€0.00',
        title: 'Total',
      },
      {},
    );
  });

  it('renders as expected', () => {
    jest.spyOn(apiHook, 'useAccountsTotals').mockReturnValue({
      data: { guid: new Money(100, 'EUR') } as AccountsTotals,
    } as UseQueryResult<AccountsTotals>);

    render(<TotalWidget account={account} />);

    expect(StatisticsWidget).toBeCalledWith(
      {
        className: 'mr-2',
        description: expect.anything(),
        stats: '€100.00',
        title: 'Total',
      },
      {},
    );
  });
});
