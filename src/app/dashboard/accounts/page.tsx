'use client';

import React from 'react';

import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/AddAccountButton';

export default function AccountsPage(): JSX.Element {
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
      <AccountsTable />
    </>
  );
}
