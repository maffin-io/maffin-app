import React from 'react';

import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import { AssetSankey, NetWorthHistogram } from '@/components/charts';
import { AccountsTable } from '@/components/tables';
import TotalWidget from './TotalWidget';
import SpendWidget from './SpendWidget';
import EarnWidget from './EarnWidget';

export type AssetInfoProps = {
  account: Account,
};

export default function AssetInfo({
  account,
}: AssetInfoProps): JSX.Element {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <TotalWidget account={account} />
            {
              (
                !account.placeholder
                && (
                  <>
                    <SpendWidget account={account} />
                    <EarnWidget account={account} />
                  </>
                )
              ) || (
                <StatisticsWidget
                  className="mr-2"
                  statsTextClass="!font-normal"
                  title="Subaccounts"
                  stats={(
                    <AccountsTable
                      guids={account.childrenIds}
                    />
                  )}
                  description=""
                />
              )
            }
          </div>
          <div className="card col-span-8">
            {
              !account.placeholder
              && (
                <AssetSankey
                  guid={account.guid}
                />
              )
            }
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 col-span-6">
        <div className="card col-span-12">
          <NetWorthHistogram
            height={300}
            assetsGuid={account.guid}
            assetsLabel={account.name}
            hideAssets
            liabilitiesGuid=""
            hideLiabilities
            showLegend={false}
          />
        </div>
        <div className="col-span-12" />
      </div>
    </div>
  );
}
