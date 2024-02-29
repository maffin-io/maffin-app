import React from 'react';
import { DateTime, Interval } from 'luxon';

import { useMainCurrency, useCashFlow } from '@/hooks/api';
import type { Account } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import { moneyToString } from '@/helpers/number';

export type EarnWidgetProps = {
  account: Account,
};

export default function EarnWidget({
  account,
}: EarnWidgetProps): JSX.Element {
  const { data: currency } = useMainCurrency();
  const { data: cashflow0 } = useCashFlow(account.guid);
  const { data: cashflow1 } = useCashFlow(
    account.guid,
    Interval.fromDateTimes(
      DateTime.now().minus({ month: 1 }).startOf('month'),
      DateTime.now().minus({ month: 1 }).endOf('month'),
    ),
  );
  const totalEarn0 = Math.abs(cashflow0?.filter(c => c.type === 'INCOME').reduce(
    (total, c) => c.total + total,
    0,
  ) || 0);
  const totalEarn1 = Math.abs(cashflow1?.filter(c => c.type === 'INCOME').reduce(
    (total, c) => c.total + total,
    0,
  ) || 0);
  const cashflowDifference = totalEarn0 - totalEarn1;

  return (
    <StatisticsWidget
      className="mr-2"
      title="This month income"
      stats={moneyToString(totalEarn0, currency?.mnemonic || '')}
      description={(
        <div>
          {(cashflowDifference < 0 ? '' : '+')}
          {moneyToString(cashflowDifference, currency?.mnemonic || '')}
          {' '}
          from last month
        </div>
      )}
    />
  );
}
