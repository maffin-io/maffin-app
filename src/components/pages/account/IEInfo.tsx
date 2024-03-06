import React from 'react';
import { DateTime, Interval } from 'luxon';
import classNames from 'classnames';

import type { Account } from '@/book/entities';
import { AccountsTable } from '@/components/tables';
import { TotalsPie, MonthlyTotalHistogram } from '@/components/charts';
import { EXPENSE_COLORS, INCOME_COLORS } from '@/constants/colors';
import TotalWidget from './TotalWidget';

export type IEInfoProps = {
  account: Account,
};

export default function IEInfo({
  account,
}: IEInfoProps): JSX.Element {
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
                      backgroundColor={account.type === 'EXPENSE' ? EXPENSE_COLORS : INCOME_COLORS}
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
            interval={
              Interval.fromDateTimes(
                DateTime.now().minus({ year: 1 }).startOf('month'),
                DateTime.now(),
              )
            }
          />
        </div>
        <div className="col-span-12" />
      </div>
    </div>
  );
}
