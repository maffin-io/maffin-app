'use client';

import React from 'react';
import useSWRImmutable from 'swr/immutable';

import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/AddAccountButton';
import { getAccountsWithPath } from '@/book/queries';
import { PriceDB, PriceDBMap } from '@/book/prices';

export default function AccountsPage(): JSX.Element {
  let { data: accounts } = useSWRImmutable(
    '/api/accounts/splits',
    () => getAccountsWithPath({
      relations: { splits: true },
      showRoot: true,
    }),
  );

  let { data: todayPrices } = useSWRImmutable(
    '/api/prices/today',
    PriceDB.getTodayQuotes,
  );

  accounts = accounts || [];
  todayPrices = todayPrices || new PriceDBMap();

  return (
    <>
      <div className="grid grid-cols-12 items-center pb-4">
        <span className="col-span-10 text-xl font-medium">
          Accounts
        </span>
        <div className="col-span-2 col-end-13 justify-self-end">
          <AddAccountButton />
        </div>
      </div>
      <AccountsTable
        accounts={accounts}
        todayPrices={todayPrices}
      />
    </>
  );
}
