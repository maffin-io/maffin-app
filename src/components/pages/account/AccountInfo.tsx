import React from 'react';

import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import { useSplitsTotal } from '@/hooks/api';
import TotalLineChart from './TotalLineChart';
import SplitsHistogram from './SplitsHistogram';

export type AccountInfoProps = {
  account: Account,
};

export default function AccountInfo({
  account,
}: AccountInfoProps): JSX.Element {
  const { data: t } = useSplitsTotal(account.guid);

  const total = new Money(t || 0, account.commodity.mnemonic);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <StatisticsWidget
              className="mr-2"
              title="This account has a total of"
              stats={total.format()}
              description=""
            />
          </div>
          <div className="col-span-8" />
          <div className="card col-span-12">
            <TotalLineChart account={account} />
          </div>
        </div>
      </div>
      <div className="card col-span-6">
        <div className="flex h-full items-center">
          <SplitsHistogram account={account} />
        </div>
      </div>
    </div>
  );
}
