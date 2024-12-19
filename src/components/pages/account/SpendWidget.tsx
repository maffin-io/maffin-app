import React from 'react';
import { BiCalendar } from 'react-icons/bi';
import { DateTime, Interval } from 'luxon';

import { useCashFlow } from '@/hooks/api';
import type { Account } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import Money from '@/book/Money';
import { isLiability } from '@/book/helpers';

export type SpendWidgetProps = {
  account: Account,
};

/**
 * Given a cashflow, compute the money that has been spent in this account
 * through EXPENSE accounts.
 */
export default function SpendWidget({
  account,
}: SpendWidgetProps): React.JSX.Element {
  const zero = new Money(0, account.commodity.mnemonic || '');

  const { data: periodCashflow } = useCashFlow(account.guid);
  const periodSpend = periodCashflow?.filter(c => c.type === 'EXPENSE').reduce(
    (total, c) => c.total.add(total),
    zero,
  ) || zero;

  const { data: currentMonthCashflow } = useCashFlow(
    account.guid,
    Interval.fromDateTimes(
      DateTime.now().startOf('month'),
      DateTime.now(),
    ),
  );
  const monthSpend = currentMonthCashflow?.filter(
    c => c.type === 'EXPENSE' || isLiability(c.type),
  ).reduce(
    (total, c) => c.total.add(total),
    zero,
  ) || zero;

  return (
    <StatisticsWidget
      className="mr-2"
      title="Expenses"
      stats={periodSpend.format()}
      description={(
        <div className="flex items-center">
          <BiCalendar className="mr-1" />
          {monthSpend.abs().format()}
          {' '}
          this month
        </div>
      )}
    />
  );
}
