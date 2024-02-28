import React from 'react';
import { DateTime, Interval } from 'luxon';
import { BiHappy, BiSad } from 'react-icons/bi';

import { useMainCurrency, useCashFlow } from '@/hooks/api';
import type { Account } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import { moneyToString } from '@/helpers/number';

export type TotalWidgetProps = {
  account: Account,
};

export default function TotalWidget({
  account,
}: TotalWidgetProps): JSX.Element {
  const { data: currency } = useMainCurrency();
  const { data: cashflow0 } = useCashFlow(account.guid);
  const { data: cashflow1 } = useCashFlow(
    account.guid,
    Interval.fromDateTimes(
      DateTime.now().minus({ month: 1 }).startOf('month'),
      DateTime.now().minus({ month: 1 }).endOf('month'),
    ),
  );
  const totalSpend0 = cashflow0?.filter(c => c.type === 'EXPENSE').reduce(
    (total, c) => c.total + total,
    0,
  ) || 0;
  const totalSpend1 = cashflow1?.filter(c => c.type === 'EXPENSE').reduce(
    (total, c) => c.total + total,
    0,
  ) || 0;
  const cashflowDifference = totalSpend0 - totalSpend1;

  return (
    <StatisticsWidget
      className="mr-2"
      title="This month spend"
      stats={moneyToString(totalSpend0, currency?.mnemonic || '')}
      description={(
        <div className="flex items-center">
          {
            cashflowDifference >= 0
            && <BiSad className="mr-1 amount-negative" />
          }
          {
            cashflowDifference < 0
            && <BiHappy className="mr-1 amount-positive" />
          }
          {(cashflowDifference < 0 ? '' : '+')}
          {moneyToString(cashflowDifference, currency?.mnemonic || '')}
          {' '}
          from last month
        </div>
      )}
    />
  );
}
