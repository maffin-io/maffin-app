import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import {
  AccountInfo,
  SplitsHistogram,
  TotalLineChart,
} from '@/components/pages/account';
import StatisticsWidget from '@/components/StatisticsWidget';
import * as apiHook from '@/hooks/api';
import type { Account } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/pages/account/SplitsHistogram', () => jest.fn(
  () => <div data-testid="SplitsHistogram" />,
));

jest.mock('@/components/pages/account/TotalLineChart', () => jest.fn(
  () => <div data-testid="TotalLineChart" />,
));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

describe('AccountInfo', () => {
  let account: Account;
  beforeEach(() => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-03-01') as DateTime<true>);
    account = {
      guid: 'guid',
      type: 'ASSET',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected when no splits', () => {
    const { container } = render(
      <AccountInfo account={account} />,
    );

    expect(TotalLineChart).toBeCalledWith(
      {
        account,
      },
      {},
    );
    expect(SplitsHistogram).toBeCalledWith(
      {
        account,
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'You have a total of',
        stats: '€0.00',
        description: 'with an average of €0.00 per month',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        title: 'This year you have',
        stats: '€0.00',
        description: 'in this account',
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with splits', () => {
    jest.spyOn(apiHook, 'useSplits').mockReturnValue({
      data: [
        {
          transaction: {
            date: DateTime.fromISO('2023-01-01'),
          },
          quantity: 10,
        },
        {
          transaction: {
            date: DateTime.fromISO('2023-03-01'),
          },
          quantity: 50,
        },
      ],
    } as SWRResponse);

    render(
      <AccountInfo account={account} />,
    );

    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'You have a total of',
        stats: '€60.00',
        description: 'with an average of -€30.00 per month',
      },
      {},
    );
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      2,
      {
        title: 'This year you have',
        stats: '€60.00',
        description: 'in this account',
      },
      {},
    );
  });
});
