import React from 'react';
import { DateTime } from 'luxon';
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi';

import { useAccountsTotals } from '@/hooks/api';
import Money from '@/book/Money';
import type { Account } from '@/book/entities';

export type MonthChangeProps = {
  account: Account,
  className?: string,
};

export default function MonthChange({
  account,
  className = '',
}: MonthChangeProps): JSX.Element {
  const { data: t0 } = useAccountsTotals();
  const { data: t1 } = useAccountsTotals(DateTime.now().minus({ month: 1 }).endOf('month'));

  const total0 = t0?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const total1 = t1?.[account.guid] || new Money(0, account.commodity.mnemonic);
  const difference = total0.subtract(total1);

  return (
    <div className={`flex items-center ${className}`}>
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
  );
}
