'use client';

import React from 'react';
import { DateTime } from 'luxon';

import AccountFormButton from '@/components/buttons/AccountFormButton';
import {
  AccountsTable,
  NetWorthPie,
  NetWorthHistogram,
  MonthlyTotalHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import Loading from '@/components/Loading';
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
          <Loading />
        </div>
      </div>
    );
  }

  accounts = accounts || { root: { childrenIds: [] } };
  const showOnboarding = Object.keys(accounts).length <= 2;

  return (
    <>
      <Onboarding show={showOnboarding} />
      <div className="header">
        <span className="title">
          Dashboard
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
          <AccountFormButton />
        </div>
      </div>
      <div className="grid grid-cols-12 items-start items-top">
        <div className="grid grid-cols-12 col-span-3">
          <div className="card col-span-12 mb-0 rounded-b-none">
            <NetWorthPie
              selectedDate={selectedDate}
            />
            <div className="mt-4">
              <AccountsTable
                selectedDate={selectedDate}
                isExpanded={showOnboarding}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 col-span-9">
          <div className="card col-span-9">
            <NetWorthHistogram
              startDate={earliestDate}
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-3">
            <LatestTransactions />
          </div>
          <div className="card col-span-6">
            <MonthlyTotalHistogram
              accounts={accounts?.type_income?.childrenIds.map((guid: string) => accounts?.[guid])}
              title="Income"
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-6">
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
