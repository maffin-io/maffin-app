import React from 'react';

import { useAccountsTotals } from '@/hooks/api';
import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import StatisticsWidget from '@/components/StatisticsWidget';
import TotalChange from '@/components/widgets/TotalChange';

export type TotalWidgetProps = {
  account: Account,
};

export default function TotalWidget({
  account,
}: TotalWidgetProps): JSX.Element {
  const { data: t0 } = useAccountsTotals();
  const total0 = t0?.[account.guid] || new Money(0, account.commodity.mnemonic);

  return (
    <StatisticsWidget
      className="mr-2"
      title="Total"
      stats={total0.format()}
      description={<TotalChange account={account} />}
    />
  );
}
