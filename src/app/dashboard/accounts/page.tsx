'use client';

import React from 'react';
import { DateTime } from 'luxon';
import { BiPlusCircle } from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import {
  AccountsTable,
  NetWorthPie,
  MonthlyTotalHistogram,
  IncomeExpenseHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import { NetWorthHistogram } from '@/components/charts';
import Loading from '@/components/Loading';
import DateRangeInput from '@/components/DateRangeInput';
import Onboarding from '@/components/onboarding/Onboarding';
import { useAccounts } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';

export default function AccountsPage(): JSX.Element {
  const { data, isLoading } = useAccounts();
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

  const accountsMap = mapAccounts(data);
  const showOnboarding = Object.keys(accountsMap).length <= 2;

  return (
    <>
      <Onboarding show={showOnboarding} />
      <div className="header">
        <span className="title">
          Dashboard
        </span>
        <span className="ml-auto mr-3">
          <DateRangeInput
            dateRange={{
              start: selectedDate,
              end: selectedDate,
            }}
            onChange={(value: { start: DateTime, end: DateTime }) => setSelectedDate(value.start)}
            asSingle
          />
        </span>
        <div>
          <FormButton
            id="add-account"
            modalTitle="Add account"
            buttonContent={(
              <>
                <BiPlusCircle className="mr-1" />
                Add Account
              </>
            )}
          >
            <AccountForm />
          </FormButton>
        </div>
      </div>
      <div className="grid grid-cols-12 items-start items-top">
        <div className="grid grid-cols-12 col-span-3">
          <div className="card col-span-12">
            <NetWorthPie
              selectedDate={selectedDate}
            />
            <div id="accounts-table" className="divide-y divide-slate-400/25 mt-4">
              <div className="pb-2">
                <AccountsTable
                  guids={[
                    accountsMap.type_asset?.guid,
                    accountsMap.type_liability?.guid,
                  ]}
                  selectedDate={selectedDate}
                  isExpanded={showOnboarding}
                />
              </div>
              <div className="pt-2">
                <AccountsTable
                  guids={[
                    accountsMap.type_income?.guid,
                    accountsMap.type_expense?.guid,
                  ]}
                  selectedDate={selectedDate}
                  isExpanded={showOnboarding}
                />
              </div>
            </div>
          </div>
          <div className="card col-span-12">
            <LatestTransactions />
          </div>
        </div>
        <div className="grid grid-cols-12 col-span-9">
          <div className="card col-span-8">
            <NetWorthHistogram
              assetsGuid="type_asset"
              liabilitiesGuid="type_liability"
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-4">
            <MonthlyTotalHistogram
              accounts={
                accountsMap?.type_income?.childrenIds.map((guid: string) => accountsMap?.[guid])
              }
              title="Income"
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-8">
            <IncomeExpenseHistogram
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-4">
            <MonthlyTotalHistogram
              accounts={
                accountsMap?.type_expense?.childrenIds.map((guid: string) => accountsMap?.[guid])
              }
              title="Expenses"
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
