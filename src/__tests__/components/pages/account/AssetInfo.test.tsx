import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';

import { AssetInfo } from '@/components/pages/account';
import { TotalsPie, NetWorthHistogram, AssetSankey } from '@/components/charts';
import TotalWidget from '@/components/pages/account/TotalWidget';
import SpendWidget from '@/components/pages/account/SpendWidget';
import EarnWidget from '@/components/pages/account/EarnWidget';
import type { Account } from '@/book/entities';
import { AccountsTable } from '@/components/tables';
import TotalChange from '@/components/widgets/TotalChange';

jest.mock('@/components/charts/NetWorthHistogram', () => jest.fn(
  () => <div data-testid="NetWorthHistogram" />,
));

jest.mock('@/components/StatisticsWidget', () => jest.fn(
  () => <div data-testid="StatisticsWidget" />,
));

jest.mock('@/components/tables/AccountsTable', () => jest.fn(
  () => <div data-testid="AccountsTable" />,
));

jest.mock('@/components/charts/TotalsPie', () => jest.fn(
  () => <div data-testid="TotalsPie" />,
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

jest.mock('@/components/widgets/TotalChange', () => jest.fn(
  () => <div data-testid="TotalChange" />,
));

jest.mock('@/components/tables/AccountsTable', () => jest.fn(
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

  it('renders as expected when not placeholder Asset', () => {
    const { container } = render(
      <AssetInfo account={account} />,
    );

    expect(NetWorthHistogram).toBeCalledWith(
      {
        height: 428,
        title: 'Net worth',
        assetsGuid: 'guid',
        assetsConfig: {
          label: 'Assets',
          borderColor: '#06B6D455',
          type: 'line',
        },
        showLegend: false,
      },
      {},
    );
    expect(AssetSankey).toBeCalledWith({ height: 428, account }, {});
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

  it('renders as expected when not placeholder Liability', () => {
    account.type = 'CREDIT';
    account.name = 'Liabilities';

    render(
      <AssetInfo account={account} />,
    );

    expect(NetWorthHistogram).toBeCalledWith(
      {
        height: 428,
        title: 'Debt',
        liabilitiesGuid: 'guid',
        liabilitiesConfig: {
          label: 'Liabilities',
          borderColor: '#FF660055',
          type: 'line',
        },
        showLegend: false,
      },
      {},
    );
  });

  it('renders as expected when placeholder', () => {
    account.placeholder = true;
    account.childrenIds = ['1', '2'];

    const { container } = render(
      <AssetInfo account={account} />,
    );

    expect(NetWorthHistogram).toBeCalledWith(
      {
        height: 428,
        title: 'Net worth',
        assetsGuid: 'guid',
        assetsConfig: {
          label: 'Assets',
          borderColor: '#06B6D455',
          type: 'line',
        },
        showLegend: false,
      },
      {},
    );
    expect(AccountsTable).toBeCalledWith({ guids: ['1', '2'] }, {});
    expect(TotalsPie).toBeCalledWith(
      {
        guids: ['1', '2'],
        showDataLabels: false,
        showTooltip: true,
        title: '',
      },
      {},
    );
    expect(TotalChange).toBeCalledWith(
      {
        account,
        className: 'justify-center text-sm mt-1',
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });
});
