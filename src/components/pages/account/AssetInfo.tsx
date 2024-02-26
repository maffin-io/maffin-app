import React from 'react';

import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import { useAccountTotal } from '@/hooks/api';
import { NetWorthHistogram } from '@/components/charts';

export type AssetInfoProps = {
  account: Account,
};

export default function AssetInfo({
  account,
}: AssetInfoProps): JSX.Element {
  const { data: t } = useAccountTotal(account.guid);

  const total = new Money(t || 0, account.commodity.mnemonic);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <StatisticsWidget
              className="mr-2"
              title="Total"
              stats={total.abs().format()}
              description=""
            />
          </div>
          <div className="col-span-8" />
        </div>
      </div>
      <div className="card col-span-6">
        <div className="flex h-full items-center">
          <NetWorthHistogram
            assetsGuid={account.guid}
            assetsLabel={account.name}
            hideAssets
            liabilitiesGuid=""
            hideLiabilities
            showLegend={false}
          />
        </div>
      </div>
    </div>
  );
}
