import React from 'react';
import classNames from 'classnames';

import type { Account } from '@/book/entities';
import { AssetSankey, NetWorthHistogram, TotalsPie } from '@/components/charts';
import { AccountsTable } from '@/components/tables';
import TotalChange from '@/components/widgets/TotalChange';
import { isAsset } from '@/book/helpers';
import TotalWidget from './TotalWidget';
import SpendWidget from './SpendWidget';
import EarnWidget from './EarnWidget';

export type AssetInfoProps = {
  account: Account,
};

export default function AssetInfo({
  account,
}: AssetInfoProps): React.JSX.Element {
  return (
    <div className="grid md:grid-cols-12 items-start">
      <div className="grid md:grid-cols-12 auto-cols-fr items-start col-span-6">
        <div
          className={classNames({
            'card md:col-span-6': account.placeholder,
            'md:col-span-4': !account.placeholder,
          })}
        >
          {
            (
              account.placeholder
              && (
                <div className="items-center">
                  <TotalsPie
                    title=""
                    guids={account.childrenIds}
                    showTooltip
                    showDataLabels={false}
                  />
                  <TotalChange
                    account={account}
                    className="justify-center text-sm mt-1"
                  />
                  <div className="mt-4">
                    <AccountsTable
                      guids={account.childrenIds}
                    />
                  </div>
                </div>
              )
            ) || (
              <>
                <TotalWidget account={account} />
                <SpendWidget account={account} />
                <EarnWidget account={account} />
              </>
            )
          }
        </div>
        <div
          className={classNames('card', {
            'md:col-span-6': account.placeholder,
            'md:col-span-8': !account.placeholder,
          })}
        >
          {
            !account.placeholder
            && (
              <AssetSankey
                height={428}
                account={account}
              />
            )
          }
        </div>
      </div>
      <div className="col-span-6">
        <div className="card">
          {
            (
              isAsset(account)
              && (
                <NetWorthHistogram
                  height={428}
                  title="Net worth"
                  assetsGuid={account.guid}
                  assetsConfig={{
                    label: account.name,
                    type: 'line',
                    borderColor: '#06B6D455',
                  }}
                  showLegend={false}
                />
              )
            ) || (
              <NetWorthHistogram
                height={428}
                title="Debt"
                liabilitiesGuid={account.guid}
                liabilitiesConfig={{
                  label: account.name,
                  type: 'line',
                  borderColor: '#FF660055',
                }}
                showLegend={false}
              />
            )
          }
        </div>
      </div>
    </div>
  );
}
