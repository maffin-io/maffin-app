import React from 'react';
import { DateTime, Interval } from 'luxon';
import { BiCalendar } from 'react-icons/bi';

import { useMainCurrency, useCashFlow } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
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
  const { data: interval } = useInterval();
  const { data: periodCashflow } = useCashFlow(account.guid, interval);
  const periodEarn = periodCashflow?.filter(c => c.total < 0).reduce(
    (total, c) => c.total + total,
    0,
  ) || 0;

  const { data: currentMonthCashflow } = useCashFlow(
    account.guid,
    Interval.fromDateTimes(
      DateTime.now().startOf('month'),
      DateTime.now(),
    ),
  );
  const monthEarn = currentMonthCashflow?.filter(c => c.total < 0).reduce(
    (total, c) => c.total + total,
    0,
  ) || 0;

  return (
    <StatisticsWidget
      className="mr-2"
      title="Money in"
      stats={moneyToString(Math.abs(periodEarn), currency?.mnemonic || '')}
      description={(
        <div className="flex items-center">
          <BiCalendar className="mr-1" />
          {moneyToString(Math.abs(monthEarn), currency?.mnemonic || '')}
          {' '}
          this month
        </div>
      )}
    />
  );
}
