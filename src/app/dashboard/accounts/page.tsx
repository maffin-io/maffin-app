'use client';

import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';

import AccountsTable from '@/components/AccountsTable';

export default function AccountsPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      <div className="grid grid-cols-12 items-center pb-4">
        <span className="col-span-10 text-xl font-medium">
          Accounts
        </span>
        <div className="col-span-2 col-end-13 justify-self-end">
          <button
            className="btn-primary"
            type="button"
            onClick={() => setIsModalOpen(!isModalOpen)}
          >
            <BiPlusCircle className="mr-1" />
            Add Account
          </button>
        </div>
      </div>
      <AccountsTable />
    </>
  );
}
