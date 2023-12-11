import React from 'react';

import type { Account } from '@/book/entities';
import InvestmentChart from './InvestmentChart';

export type InvestmentInfoProps = {
  account: Account,
};

export default function InvestmentInfo({
  account,
}: InvestmentInfoProps): JSX.Element {
  return (
    <div className="grid grid-cols-12">
      <div className="card col-span-8">
        <InvestmentChart account={account} />
      </div>
    </div>
  );
}
