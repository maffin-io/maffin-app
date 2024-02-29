import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';

import { AssetInfo } from '@/components/pages/account';
import { NetWorthHistogram, AssetSankey } from '@/components/charts';
import StatisticsWidget from '@/components/StatisticsWidget';
import TotalWidget from '@/components/pages/account/TotalWidget';
import SpendWidget from '@/components/pages/account/SpendWidget';
import EarnWidget from '@/components/pages/account/EarnWidget';
import type { Account } from '@/book/entities';

jest.mock('@/components/charts/NetWorthHistogram', () => jest.fn(
  () => <div data-testid="NetWorthHistogram" />,
));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/charts/AssetSankey', () => jest.fn(
  () => <div data-testid="AssetSankey" />,
));

jest.mock('@/components/pages/account/TotalWidget', () => jest.fn(
  () => <div data-testid="TotalWidget" />,
));

jest.mock('@/components/pages/account/SpendWidget', () => jest.fn(
  () => <div data-testid="SpendWidget" />,
));

jest.mock('@/components/pages/account/EarnWidget', () => jest.fn(
  () => <div data-testid="EarnWidget" />,
));

jest.mock('@/components/pages/accounts/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

describe('AssetInfo', () => {
  let account: Account;
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-03-01') as DateTime<true>);
    account = {
      guid: 'guid',
      name: 'Assets',
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
      <AssetInfo account={account} />,
    );

    expect(NetWorthHistogram).toBeCalledWith(
      {
        height: 300,
        assetsGuid: 'guid',
        assetsLabel: 'Assets',
        hideAssets: true,
        hideLiabilities: true,
        liabilitiesGuid: '',
        showLegend: false,
      },
      {},
    );
    expect(AssetSankey).toBeCalledWith({ guid: 'guid' }, {});
    expect(TotalWidget).toBeCalledWith(
      { account },
      {},
    );
    expect(SpendWidget).toBeCalledWith(
      { account },
      {},
    );
    expect(EarnWidget).toBeCalledWith(
      { account },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('shows account table when placeholder', () => {
    account.placeholder = true;
    render(
      <AssetInfo account={account} />,
    );

    expect(StatisticsWidget).toBeCalledTimes(1);
    expect(StatisticsWidget).toHaveBeenNthCalledWith(
      1,
      {
        className: 'mr-2',
        title: 'Subaccounts',
        description: '',
        statsTextClass: '!font-normal',
        // Don't know how to check for AccountsTable here
        stats: expect.anything(),
      },
      {},
    );
  });
});
