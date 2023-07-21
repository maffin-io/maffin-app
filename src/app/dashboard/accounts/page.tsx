'use client';

import React from 'react';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useDataSource } from '@/hooks';

import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import { getAccountsWithPath } from '@/book/queries';
import { PriceDB, PriceDBMap } from '@/book/prices';

export default function AccountsPage(): JSX.Element {
  const { save } = useDataSource();
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
          <AddAccountButton
            onSave={() => {
              save();
              mutate('/api/accounts');
              mutate('/api/accounts/splits');
            }}
          />
        </div>
      </div>
      <AccountsTable
        accounts={accounts}
        todayPrices={todayPrices}
      />
    </>
  );
}
