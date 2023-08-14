'use client';

import React from 'react';
import { DateTime } from 'luxon';

import AddAccountButton from '@/components/buttons/AddAccountButton';
import {
  AccountsTable,
  NetWorthPie,
  NetWorthHistogram,
  MonthlyTotalHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import DateRangeInput from '@/components/DateRangeInput';
import * as API from '@/hooks/api';
import getAccountsTree from '@/lib/getAccountsTree';

export default function AccountsPage(): JSX.Element {
  const { data: earliestDate } = API.useStartDate();
  let { data: accounts } = API.useAccounts();
  let { data: monthlyTotals } = API.useAccountsMonthlyTotals();

  const [selectedDate, setSelectedDate] = React.useState(DateTime.now());

  accounts = accounts || { root: { childrenIds: [] } };
  const tree = getAccountsTree(accounts.root, accounts);
  monthlyTotals = monthlyTotals || {};

  return (
    <>
      <div className="flex items-center">
        <span className="text-xl font-medium">
          Your finances
        </span>
        <span className="ml-auto mr-3">
          <DateRangeInput
            earliestDate={earliestDate}
            dateRange={{
              start: selectedDate,
              end: selectedDate,
            }}
            onChange={(value: { start: DateTime, end: DateTime }) => setSelectedDate(value.start)}
            asSingle
          />
        </span>
        <div>
          <AddAccountButton />
        </div>
      </div>
      <div className="grid grid-cols-12 items-start items-top pb-4">
        <div className="grid grid-cols-12 col-span-3">
          <div className="col-span-12 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <NetWorthPie
              unit={tree.leaves.find(a => a.account.type === 'ASSET')?.account.commodity.mnemonic}
              assetsSeries={monthlyTotals[tree.leaves.find(a => a.account.type === 'ASSET')?.account.guid]}
              liabilitiesSeries={monthlyTotals[tree.leaves.find(a => a.account.type === 'LIABILITY')?.account.guid]}
              selectedDate={selectedDate}
            />
          </div>
          <div className="col-span-12 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <AccountsTable
              selectedDate={selectedDate}
              accounts={accounts}
              monthlyTotals={monthlyTotals}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-start items-top col-span-9">
          <div className="col-span-9 p-4 mb-4 mr-4 rounded-sm bg-gunmetal-700">
            <NetWorthHistogram
              tree={tree}
              startDate={earliestDate}
              selectedDate={selectedDate}
              monthlyTotals={monthlyTotals}
            />
          </div>
          <div className="col-span-3 p-4 mb-4 mr-4 rounded-sm bg-gunmetal-700">
            <LatestTransactions />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              title="Income"
              tree={tree.leaves.find(a => a.account.type === 'INCOME')}
              selectedDate={selectedDate}
              monthlyTotals={monthlyTotals}
            />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              title="Expenses"
              tree={tree.leaves.find(a => a.account.type === 'EXPENSE')}
              selectedDate={selectedDate}
              monthlyTotals={monthlyTotals}
            />
          </div>
        </div>
      </div>
    </>
  );
}
