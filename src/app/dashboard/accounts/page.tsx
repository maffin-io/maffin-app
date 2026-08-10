'use client';

import React from 'react';
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
import Onboarding from '@/components/onboarding/Onboarding';
import { useAccounts } from '@/hooks/api';
import mapAccounts from '@/helpers/mapAccounts';
import { ASSET, LIABILITY } from '@/constants/colors';
import ReportsDropdown from '@/components/buttons/ReportsDropdown';

export default function AccountsPage(): React.JSX.Element {
  const { data, isLoading } = useAccounts();

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
        <div className="flex ml-auto gap-4">
          <ReportsDropdown />
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
      <div className="grid md:grid-cols-12 items-start">
        <div className="col-span-12 md:col-span-3">
          <div className="card">
            <TotalsPie
              title="Net worth"
              backgroundColor={[ASSET, LIABILITY]}
              guids={[accountsMap.type_asset?.guid, accountsMap.type_liability?.guid]}
            />
            <div id="accounts-table" className="divide-y divide-slate-400/25 mt-4">
              <div className="pb-2">
                <AccountsTable
                  guids={[
                    accountsMap.type_asset?.guid,
                    accountsMap.type_liability?.guid,
                  ]}
                  isExpanded={showOnboarding}
                />
              </div>
              <div className="pt-2">
                <AccountsTable
                  guids={[
                    accountsMap.type_income?.guid,
                    accountsMap.type_expense?.guid,
                  ]}
                  isExpanded={showOnboarding}
                />
              </div>
            </div>
          </div>
          <div className="card">
            <LatestTransactions />
          </div>
        </div>
        <div className="grid grid-cols-12 col-span-12 md:col-span-9">
          <div className="card col-span-12 md:col-span-8">
            <NetWorthHistogram
              assetsGuid="type_asset"
              assetsConfig={{
                label: 'Assets',
              }}
              liabilitiesGuid="type_liability"
              liabilitiesConfig={{
                label: 'Liabilities',
              }}
            />
          </div>
          <div className="card col-span-12 md:col-span-4">
            <MonthlyTotalHistogram
              guids={accountsMap?.type_income?.childrenIds}
              title="Income"
            />
          </div>
          <div className="card col-span-12 md:col-span-8">
            <IncomeExpenseHistogram />
          </div>
          <div className="card col-span-12 md:col-span-4">
            <MonthlyTotalHistogram
              guids={accountsMap?.type_expense?.childrenIds}
              title="Expenses"
            />
          </div>
        </div>
      </div>
    </>
  );
}
