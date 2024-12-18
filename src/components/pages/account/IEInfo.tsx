import React from 'react';
import classNames from 'classnames';

import type { Account } from '@/book/entities';
import { AccountsTable } from '@/components/tables';
import { TotalsPie, MonthlyTotalHistogram } from '@/components/charts';
import TotalWidget from './TotalWidget';

export type IEInfoProps = {
  account: Account,
};

export default function IEInfo({
  account,
}: IEInfoProps): React.JSX.Element {
  return (
    <div className="grid md:grid-cols-12 items-start">
      <div className="grid md:grid-cols-12 auto-cols-fr items-start col-span-6">
        <div
          className={classNames({
            'card md:col-span-6': account.placeholder,
            'md:col-span-4': !account.placeholder,
          })}
        >
          {
            (
              account.placeholder
              && (
                <>
                  <TotalsPie
                    title={getTitle(account.type)}
                    guids={account.childrenIds}
                    showTooltip
                    showDataLabels={false}
                  />
                  <div className="mt-4">
                    <AccountsTable
                      guids={account.childrenIds}
                    />
                  </div>
                </>
              )
            ) || (
              <TotalWidget account={account} />
            )
          }
        </div>
        <div
          className={classNames('card', {
            'md:col-span-6': account.placeholder,
            'md:col-span-8': !account.placeholder,
          })}
        />
      </div>
      <div className="col-span-6">
        <div className="card">
          <MonthlyTotalHistogram
            title=""
            guids={account.placeholder ? account.childrenIds : [account.guid]}
          />
        </div>
        <div className="col-span-12" />
      </div>
    </div>
  );
}

function getTitle(type: string): string {
  if (type === 'INCOME') {
    return 'Total earned';
  }

  if (type === 'EXPENSE') {
    return 'Total spent';
  }

  return 'Total';
}
