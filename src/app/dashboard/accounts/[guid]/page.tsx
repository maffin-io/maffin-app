'use client';

import React from 'react';

import {
  TransactionsTable,
  Header,
  AccountInfo,
  InvestmentInfo,
} from '@/components/pages/account';
import { useAccounts } from '@/hooks/api';
import Loading from '@/components/Loading';
import { Account } from '@/book/entities';
import { isInvestment } from '@/book/helpers';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  let { data: accounts } = useAccounts();

  // We cant use fallback data to set a default as SWR treats
  // fallback data as stale data which means with immutable we will
  // never refresh the data.
  accounts = accounts || {};

  if (!Object.keys(accounts).length) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  const account = accounts[params.guid] as Account;
  if (!account) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        {`Account ${params.guid} does not exist`}
      </div>
    );
  }

  return (
    <>
      <Header account={account} />
      {
        isInvestment(account)
        && (
          <InvestmentInfo account={account} />
        )
      }
      {
        !isInvestment(account)
        && (
          <AccountInfo account={account} />
        )
      }
      <div className="card p-0 mt-4 bg-light-100 dark:bg-dark-800">
        <TransactionsTable account={account} />
      </div>
    </>
  );
}
