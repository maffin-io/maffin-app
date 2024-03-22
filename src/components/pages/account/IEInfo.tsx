import React from 'react';
import classNames from 'classnames';

import type { Account } from '@/book/entities';
import { AccountsTable } from '@/components/tables';
import { TotalsPie, MonthlyTotalHistogram } from '@/components/charts';
import { useInterval } from '@/hooks/state';
import TotalWidget from './TotalWidget';

export type IEInfoProps = {
  account: Account,
};

export default function IEInfo({
  account,
}: IEInfoProps): JSX.Element {
  const { data: interval } = useInterval();

  return (
    <div className="grid grid-cols-12 items-start">
      <div className="col-span-6">
        <div className="grid grid-cols-12 items-start">
          <div
            className={classNames({
              'card col-span-6': account.placeholder,
              'col-span-4': !account.placeholder,
            })}
          >
            {
              (
                account.placeholder
                && (
                  <>
                    <TotalsPie
                      title={account.type === 'EXPENSE' ? 'Total spent' : 'Total earned'}
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
              'col-span-6': account.placeholder,
              'col-span-8': !account.placeholder,
            })}
          />
        </div>
      </div>
      <div className="grid grid-cols-12 col-span-6">
        <div className="card col-span-12">
          <MonthlyTotalHistogram
            title=""
            guids={account.placeholder ? account.childrenIds : [account.guid]}
            interval={interval}
          />
        </div>
        <div className="col-span-12" />
      </div>
    </div>
  );
}
