import React from 'react';
import { DateTime } from 'luxon';

import StatisticsWidget from '@/components/StatisticsWidget';
import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import { useSplits } from '@/hooks/api';
import TotalLineChart from './TotalLineChart';
import SplitsHistogram from './SplitsHistogram';

export type AccountInfoProps = {
  account: Account,
};

export default function AccountInfo({
  account,
}: AccountInfoProps): JSX.Element {
  let { data: splits } = useSplits(account.guid);
  splits = splits || [];

  const total = new Money(splits.reduce(
    (acc, split) => acc + split.quantity,
    0,
  ), account.commodity.mnemonic);
  const numMonths = (splits.length && (splits[0].transaction.date.diff(
    splits[splits.length - 1].transaction.date,
    ['months', 'days'],
  ).months || 1)) || 1;
  const average = new Money(total.toNumber() / numMonths, account.commodity.mnemonic);

  let totalKeyword = 'have';
  if (account.type === 'EXPENSE') {
    totalKeyword = 'have spent';
  }
  if (account.type === 'INCOME') {
    totalKeyword = 'have earned';
  }
  if (account.type === 'LIABILITY') {
    totalKeyword = 'owe';
  }

  const currentYear = DateTime.now().year;
  let totalThisYear = 0;

  splits.every(split => {
    if (split.transaction.date.year !== currentYear) {
      return false;
    }

    let { quantity } = split;
    if (account.type === 'INCOME') {
      quantity = -quantity;
    }

    totalThisYear += quantity;
    return true;
  });

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-6">
        <div className="grid grid-cols-12">
          <div className="col-span-6">
            <StatisticsWidget
              className="mr-2"
              title={`You ${totalKeyword} a total of`}
              stats={total.format()}
              description={`with an average of ${average.format()} per month`}
            />
          </div>
          <div className="col-span-6">
            <StatisticsWidget
              title={`This year you ${totalKeyword}`}
              stats={new Money(totalThisYear, account.commodity.mnemonic).format()}
              description="in this account"
            />
          </div>
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
