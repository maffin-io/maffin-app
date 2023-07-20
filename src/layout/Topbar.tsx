'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import ProfileDropdown from '@/components/ProfileDropdown';
import SaveButton from '@/components/buttons/SaveButton';
import { AccountSelector } from '@/components/selectors';
import type { Account } from '@/book/entities';

export default function Topbar(): JSX.Element {
  const router = useRouter();

  return (
    <div className="grid grid-cols-12 bg-gunmetal-700 h-20 fixed z-10 top-0 px-6 left-20 right-0">
      <div className="col-span-3">
        <AccountSelector
          id="globalSearch"
          className="py-5 pl-1"
          placeholder="Search (cmd + k)..."
          onChange={(selected: Account | null) => {
            if (selected) {
              router.push(`/dashboard/accounts/${selected.guid}`);
            }
          }}
        />
      </div>

      <div className="col-span-1 col-end-11 h-20 mb-0">
        <div className="flex h-full justify-center items-center">
          <SaveButton />
        </div>
      </div>

      <div className="col-span-2 col-end-13 h-20">
        <ProfileDropdown />
      </div>
    </div>
  );
}
