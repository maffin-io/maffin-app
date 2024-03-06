'use client';

import React from 'react';
import { DateTime, Interval } from 'luxon';
import { BiPlusCircle } from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import {
  IncomeExpenseHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import {
  MonthlyTotalHistogram,
  NetWorthHistogram,
  TotalsPie,
} from '@/components/charts';
import { AccountsTable } from '@/components/tables';
import Loading from '@/components/Loading';
import DateRangeInput from '@/components/DateRangeInput';
import Onboarding from '@/components/onboarding/Onboarding';
import { useAccounts } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';
import { ASSET, LIABILITY } from '@/constants/colors';

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
      <div className="grid grid-cols-12 items-start">
        <div className="grid grid-cols-12 col-span-3">
          <div className="card col-span-12">
            <TotalsPie
              title="Net worth"
              backgroundColor={[ASSET, LIABILITY]}
              guids={[accountsMap.type_asset?.guid, accountsMap.type_liability?.guid]}
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
              guids={accountsMap?.type_income?.childrenIds}
              title="Income"
              interval={
                Interval.fromDateTimes(
                  selectedDate.minus({ months: 6 }).startOf('month'),
                  selectedDate,
                )
              }
            />
          </div>
          <div className="card col-span-8">
            <IncomeExpenseHistogram
              selectedDate={selectedDate}
            />
          </div>
          <div className="card col-span-4">
            <MonthlyTotalHistogram
              guids={accountsMap?.type_expense?.childrenIds}
              title="Expenses"
              interval={
                Interval.fromDateTimes(
                  selectedDate.minus({ months: 6 }).startOf('month'),
                  selectedDate,
                )
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
