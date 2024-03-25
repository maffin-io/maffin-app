import React from 'react';
import { BiCalendar } from 'react-icons/bi';
import { DateTime, Interval } from 'luxon';

import { useCashFlow } from '@/hooks/api';
import type { Account } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import Money from '@/book/Money';

export type EarnWidgetProps = {
  account: Account,
};

/**
 * Given a cashflow, compute the money that has been earned in this account
 * through INCOME accounts
 */
export default function EarnWidget({
  account,
}: EarnWidgetProps): JSX.Element {
  const zero = new Money(0, account.commodity.mnemonic || '');

  const { data: periodCashflow } = useCashFlow(account.guid);
  const periodEarn = periodCashflow?.filter(c => c.type === 'INCOME').reduce(
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
  const monthEarn = currentMonthCashflow?.filter(c => c.type === 'INCOME').reduce(
    (total, c) => c.total.add(total),
    zero,
  ) || zero;

  return (
    <StatisticsWidget
      className="mr-2"
      title="Income"
      stats={periodEarn.abs().format()}
      description={(
        <div className="flex items-center">
          <BiCalendar className="mr-1" />
          {monthEarn.abs().format()}
          {' '}
          this month
        </div>
      )}
    />
  );
}
