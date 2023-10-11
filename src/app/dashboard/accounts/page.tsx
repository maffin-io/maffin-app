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
import Onboarding from '@/components/onboarding/Onboarding';
import * as API from '@/hooks/api';

export default function AccountsPage(): JSX.Element {
  const { data: earliestDate } = API.useStartDate();
  let { data: accounts } = API.useAccounts();
  const { isLoading } = API.useAccounts();

  const [selectedDate, setSelectedDate] = React.useState(DateTime.now());

  if (isLoading) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          Loading...
        </div>
      </div>
    );
  }

  accounts = accounts || { root: { childrenIds: [] } };
  const showOnboarding = Object.keys(accounts).length === 1;

  return (
    <>
      <Onboarding show={showOnboarding} />
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
              selectedDate={selectedDate}
            />
          </div>
          <div className="col-span-12 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <AccountsTable
              selectedDate={selectedDate}
              isExpanded={showOnboarding}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 col-span-9">
          <div className="col-span-9 p-4 mb-4 h-100 mr-4 rounded-sm bg-gunmetal-700">
            <div className="flex h-full items-center">
              <NetWorthHistogram
                startDate={earliestDate}
                selectedDate={selectedDate}
              />
            </div>
          </div>
          <div className="col-span-3 p-4 mb-4 mr-4 rounded-sm bg-gunmetal-700">
            <LatestTransactions />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              accounts={accounts?.type_income?.childrenIds.map((guid: string) => accounts?.[guid])}
              title="Income"
              selectedDate={selectedDate}
            />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              accounts={accounts?.type_expense?.childrenIds.map((guid: string) => accounts?.[guid])}
              title="Expenses"
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
