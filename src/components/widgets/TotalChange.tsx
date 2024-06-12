import React from 'react';
import { DateTime } from 'luxon';
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi';

import { useBalanceSheet } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import Money from '@/book/Money';
import type { Account } from '@/book/entities';

export type TotalChangeProps = {
  account: Account,
  className?: string,
};

export default function TotalChange({
  account,
  className = '',
}: TotalChangeProps): JSX.Element {
  const { data: interval } = useInterval();
  const { data: t0 } = useBalanceSheet(interval.start?.minus({ day: 1 }) as DateTime<true>);
  const { data: t1 } = useBalanceSheet(interval.end as DateTime<true>);

  const total0 = t0?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const total1 = t1?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const difference = total1.subtract(total0);

  return (
    <div className={`flex items-center ${className}`}>
      {
        difference.toNumber() >= 0
        && <BiTrendingUp className="mr-1 text-success" />
      }
      {
        difference.toNumber() < 0
        && <BiTrendingDown className="mr-1 text-danger" />
      }
      {difference.format()}
      {' '}
      this period
    </div>
  );
}
