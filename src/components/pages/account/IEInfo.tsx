import React from 'react';
import { DateTime, Interval } from 'luxon';

import type { Account } from '@/book/entities';
import { AccountsTable, MonthlyTotalHistogram } from '@/components/pages/accounts';
import StatisticsWidget from '@/components/StatisticsWidget';
import TotalWidget from './TotalWidget';

export type IEInfoProps = {
  account: Account,
};

export default function IEInfo({
  account,
}: IEInfoProps): JSX.Element {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <TotalWidget account={account} />
            {
              (
                account.placeholder
                && (
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
              )
            }
          </div>
          <div className="card col-span-8" />
        </div>
      </div>
      <div className="grid grid-cols-12 col-span-6">
        <div className="card col-span-12">
          <MonthlyTotalHistogram
            title=""
            accounts={[account]}
            interval={
              Interval.fromDateTimes(
                DateTime.now().minus({ year: 1 }).startOf('month'),
                DateTime.now(),
              )
            }
          />
        </div>
        <div className="col-span-12" />
      </div>
    </div>
  );
}
