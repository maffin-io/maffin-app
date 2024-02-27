import { DateTime } from 'luxon';
import React from 'react';
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi';

import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import { useAccountsTotals } from '@/hooks/api';
import { NetWorthHistogram } from '@/components/charts';

export type AssetInfoProps = {
  account: Account,
};

export default function AssetInfo({
  account,
}: AssetInfoProps): JSX.Element {
  const { data: t0 } = useAccountsTotals();
  const { data: t1 } = useAccountsTotals(DateTime.now().minus({ month: 1 }).endOf('month'));

  const total0 = t0?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const total1 = t1?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const difference = total0.subtract(total1);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <StatisticsWidget
              className="mr-2"
              title="Total"
              stats={total0.abs().format()}
              description={(
                <div className="flex items-center">
                  {
                    difference.toNumber() >= 0
                    && <BiTrendingUp className="mr-1 amount-positive" />
                  }
                  {
                    difference.toNumber() < 0
                    && <BiTrendingDown className="mr-1 amount-negative" />
                  }
                  {difference.format()}
                  {' '}
                  from last month
                </div>
              )}
            />
          </div>
          <div className="col-span-8" />
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
        </div>
      </div>
      <div className="card col-span-6" />
    </div>
  );
}
